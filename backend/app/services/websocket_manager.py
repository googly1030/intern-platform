"""
WebSocket Manager
Handles real-time communication for progress updates
"""

import logging
import asyncio
import json
from typing import Dict, Set, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from fastapi import WebSocket

logger = logging.getLogger(__name__)


@dataclass
class ConnectionInfo:
    """Information about a WebSocket connection"""
    websocket: WebSocket
    connected_at: datetime = field(default_factory=datetime.utcnow)
    submission_ids: Set[str] = field(default_factory=set)


class WebSocketManager:
    """
    Manages WebSocket connections for real-time progress updates.

    Supports:
    - Multiple concurrent connections
    - Subscription to specific submission IDs
    - Broadcasting progress updates to subscribers
    """

    def __init__(self):
        # Map of connection_id -> ConnectionInfo
        self._connections: Dict[str, ConnectionInfo] = {}
        # Map of submission_id -> set of connection_ids
        self._subscriptions: Dict[str, Set[str]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, connection_id: str):
        """
        Accept a new WebSocket connection.

        Args:
            websocket: The WebSocket connection
            connection_id: Unique identifier for this connection
        """
        await websocket.accept()
        async with self._lock:
            self._connections[connection_id] = ConnectionInfo(websocket=websocket)
        logger.info(f"WebSocket connected: {connection_id}")

    async def disconnect(self, connection_id: str):
        """
        Handle WebSocket disconnection.

        Args:
            connection_id: The connection to remove
        """
        async with self._lock:
            if connection_id in self._connections:
                # Remove from all subscriptions
                for submission_id in self._connections[connection_id].submission_ids:
                    if submission_id in self._subscriptions:
                        self._subscriptions[submission_id].discard(connection_id)
                        if not self._subscriptions[submission_id]:
                            del self._subscriptions[submission_id]

                del self._connections[connection_id]
        logger.info(f"WebSocket disconnected: {connection_id}")

    async def subscribe(self, connection_id: str, submission_id: str):
        """
        Subscribe a connection to updates for a specific submission.

        Args:
            connection_id: The connection to subscribe
            submission_id: The submission to subscribe to
        """
        async with self._lock:
            if connection_id in self._connections:
                self._connections[connection_id].submission_ids.add(submission_id)
                if submission_id not in self._subscriptions:
                    self._subscriptions[submission_id] = set()
                self._subscriptions[submission_id].add(connection_id)
        logger.info(f"Connection {connection_id} subscribed to submission {submission_id}")

    async def unsubscribe(self, connection_id: str, submission_id: str):
        """
        Unsubscribe a connection from a specific submission.

        Args:
            connection_id: The connection to unsubscribe
            submission_id: The submission to unsubscribe from
        """
        async with self._lock:
            if connection_id in self._connections:
                self._connections[connection_id].submission_ids.discard(submission_id)
            if submission_id in self._subscriptions:
                self._subscriptions[submission_id].discard(connection_id)
        logger.info(f"Connection {connection_id} unsubscribed from submission {submission_id}")

    async def broadcast_progress(
        self,
        submission_id: str,
        stage: str,
        progress: int,
        message: str = "",
        data: Optional[Dict[str, Any]] = None
    ):
        """
        Broadcast progress update to all connections subscribed to a submission.

        Args:
            submission_id: The submission ID
            stage: Current processing stage
            progress: Progress percentage (0-100)
            message: Status message
            data: Optional additional data
        """
        message_data = {
            "type": "progress",
            "submission_id": submission_id,
            "stage": stage,
            "progress": progress,
            "message": message,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": data or {}
        }

        # Get subscribers
        async with self._lock:
            subscriber_ids = self._subscriptions.get(submission_id, set()).copy()

        if not subscriber_ids:
            logger.debug(f"No subscribers for submission {submission_id}")
            return

        # Send to all subscribers
        disconnected = []
        for conn_id in subscriber_ids:
            if conn_id in self._connections:
                try:
                    await self._connections[conn_id].websocket.send_json(message_data)
                    logger.debug(f"Sent progress to {conn_id}: {progress}% - {stage}")
                except Exception as e:
                    logger.warning(f"Failed to send to {conn_id}: {e}")
                    disconnected.append(conn_id)

        # Clean up disconnected clients
        for conn_id in disconnected:
            await self.disconnect(conn_id)

    async def send_to_connection(
        self,
        connection_id: str,
        message_type: str,
        data: Dict[str, Any]
    ):
        """
        Send a message to a specific connection.

        Args:
            connection_id: Target connection ID
            message_type: Type of message
            data: Message data
        """
        if connection_id in self._connections:
            try:
                await self._connections[connection_id].websocket.send_json({
                    "type": message_type,
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    **data
                })
            except Exception as e:
                logger.warning(f"Failed to send to {connection_id}: {e}")
                await self.disconnect(connection_id)

    async def broadcast_to_all(self, message_type: str, data: Dict[str, Any]):
        """
        Broadcast a message to all connected clients.

        Args:
            message_type: Type of message
            data: Message data
        """
        message_data = {
            "type": message_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **data
        }

        disconnected = []
        async with self._lock:
            for conn_id, conn_info in self._connections.items():
                try:
                    await conn_info.websocket.send_json(message_data)
                except Exception as e:
                    logger.warning(f"Failed to send to {conn_id}: {e}")
                    disconnected.append(conn_id)

        for conn_id in disconnected:
            await self.disconnect(conn_id)

    @property
    def connection_count(self) -> int:
        """Get the number of active connections"""
        return len(self._connections)

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about current connections"""
        return {
            "total_connections": len(self._connections),
            "total_subscriptions": len(self._subscriptions),
            "subscriptions": {
                sub_id: len(conns)
                for sub_id, conns in self._subscriptions.items()
            }
        }


# Global WebSocket manager instance
ws_manager = WebSocketManager()


def get_websocket_manager() -> WebSocketManager:
    """Get the global WebSocket manager instance"""
    return ws_manager
