"""
Code Analyzer Service
Analyzes code structure, patterns, and best practices
"""

import os
import re
from typing import Optional


class CodeAnalyzer:
    """Service for analyzing code structure and patterns"""

    # Expected folder structure
    EXPECTED_FOLDERS = ["assets", "css", "js", "php"]
    EXPECTED_HTML_FILES = ["index.html", "login.html", "profile.html", "register.html"]
    EXPECTED_JS_FILES = ["login.js", "profile.js", "register.js"]
    EXPECTED_PHP_FILES = ["login.php", "profile.php", "register.php"]

    # Bootstrap classes to check
    BOOTSTRAP_CLASSES = [
        "container",
        "container-fluid",
        "row",
        "col-",
        "form-group",
        "form-control",
        "btn",
        "btn-primary",
        "navbar",
    ]

    def __init__(self, repo_path: str):
        """
        Initialize CodeAnalyzer.

        Args:
            repo_path: Path to the cloned repository
        """
        self.repo_path = repo_path
        self.analysis_result = {
            "folderStructure": {},
            "fileSeparation": {},
            "jqueryAjax": {},
            "bootstrap": {},
            "preparedStatements": {},
            "databases": {},
            "localStorage": {},
            "security": {},
        }

    def analyze_all(self) -> dict:
        """
        Run all analysis checks.

        Returns:
            dict with complete analysis results
        """
        self.analyze_folder_structure()
        self.analyze_file_separation()
        self.analyze_jquery_ajax()
        self.analyze_bootstrap()
        self.analyze_prepared_statements()
        self.analyze_databases()
        self.analyze_localStorage()
        self.analyze_security()

        return self.analysis_result

    def analyze_folder_structure(self) -> dict:
        """Analyze if the folder structure matches requirements"""
        result = {
            "score": 0,
            "existing_folders": [],
            "missing_folders": [],
            "existing_files": [],
            "missing_files": [],
        }

        # Check folders
        for folder in self.EXPECTED_FOLDERS:
            folder_path = os.path.join(self.repo_path, folder)
            if os.path.isdir(folder_path):
                result["existing_folders"].append(folder)
            else:
                result["missing_folders"].append(folder)

        # Check HTML files
        for file in self.EXPECTED_HTML_FILES:
            file_path = os.path.join(self.repo_path, file)
            if os.path.isfile(file_path):
                result["existing_files"].append(file)
            else:
                result["missing_files"].append(file)

        # Check JS files
        for file in self.EXPECTED_JS_FILES:
            file_path = os.path.join(self.repo_path, "js", file)
            if os.path.isfile(file_path):
                result["existing_files"].append(f"js/{file}")
            else:
                result["missing_files"].append(f"js/{file}")

        # Check PHP files
        for file in self.EXPECTED_PHP_FILES:
            file_path = os.path.join(self.repo_path, "php", file)
            if os.path.isfile(file_path):
                result["existing_files"].append(f"php/{file}")
            else:
                result["missing_files"].append(f"php/{file}")

        # Calculate score
        total_expected = len(self.EXPECTED_FOLDERS) + len(self.EXPECTED_HTML_FILES) + len(self.EXPECTED_JS_FILES) + len(self.EXPECTED_PHP_FILES)
        total_found = len(result["existing_folders"]) + len(result["existing_files"])
        result["score"] = int((total_found / total_expected) * 10) if total_expected > 0 else 0

        self.analysis_result["folderStructure"] = result
        return result

    def analyze_file_separation(self) -> dict:
        """Check if HTML, CSS, JS, and PHP are in separate files"""
        result = {
            "score": 10,
            "issues": [],
        }

        html_files = self._get_files_by_extension(".html")

        for html_file in html_files:
            content = self._read_file(html_file)

            # Check for inline styles
            style_matches = re.findall(r"<style[^>]*>.*?</style>", content, re.DOTALL)
            if style_matches:
                result["issues"].append({
                    "file": html_file,
                    "issue": "inline_css",
                    "count": len(style_matches),
                })
                result["score"] = min(result["score"], 7)

            # Check for inline scripts
            script_matches = re.findall(r"<script[^>]*>(?!.*src\s*=)(.*?)</script>", content, re.DOTALL)
            inline_scripts = [s for s in script_matches if s.strip()]
            if inline_scripts:
                result["issues"].append({
                    "file": html_file,
                    "issue": "inline_js",
                    "count": len(inline_scripts),
                })
                result["score"] = min(result["score"], 7)

            # Check for PHP in HTML
            php_matches = re.findall(r"<\?php.*?\?>", content, re.DOTALL)
            if php_matches:
                result["issues"].append({
                    "file": html_file,
                    "issue": "php_in_html",
                    "count": len(php_matches),
                })
                result["score"] = min(result["score"], 4)

        self.analysis_result["fileSeparation"] = result
        return result

    def analyze_jquery_ajax(self) -> dict:
        """Check if jQuery AJAX is used instead of form submission"""
        result = {
            "score": 10,
            "ajax_calls": 0,
            "form_submissions": 0,
            "issues": [],
        }

        js_files = self._get_files_by_extension(".js")
        html_files = self._get_files_by_extension(".html")

        all_content = ""
        for file in js_files + html_files:
            all_content += self._read_file(file) + "\n"

        # Check for jQuery AJAX calls
        ajax_patterns = [
            r"\$\s*\.\s*ajax\s*\(",
            r"\$\s*\.\s*post\s*\(",
            r"\$\s*\.\s*get\s*\(",
            r"\$\s*\(\s*[^)]+\s*\)\s*\.\s*load\s*\(",
        ]
        for pattern in ajax_patterns:
            matches = re.findall(pattern, all_content)
            result["ajax_calls"] += len(matches)

        # Check for form submissions
        form_patterns = [
            r'<form[^>]*action\s*=\s*["\'][^"\']+["\'][^>]*>',
            r'<form[^>]*method\s*=\s*["\'](?:post|get)["\'][^>]*>',
        ]
        for pattern in form_patterns:
            matches = re.findall(pattern, all_content, re.IGNORECASE)
            result["form_submissions"] += len(matches)

        # Check for submit buttons without AJAX
        submit_patterns = [
            r'<input[^>]*type\s*=\s*["\']submit["\'][^>]*>',
            r'<button[^>]*type\s*=\s*["\']submit["\'][^>]*>',
        ]
        submit_buttons = 0
        for pattern in submit_patterns:
            matches = re.findall(pattern, all_content, re.IGNORECASE)
            submit_buttons += len(matches)

        # Scoring logic
        if result["form_submissions"] > 0 and result["ajax_calls"] == 0:
            result["score"] = 0
            result["issues"].append("FORM_SUBMISSION_USED")
        elif result["form_submissions"] > 0:
            result["score"] = 4
            result["issues"].append("MIXED_AJAX_FORM")
        elif result["ajax_calls"] == 0:
            result["score"] = 5
            result["issues"].append("NO_AJAX_DETECTED")

        self.analysis_result["jqueryAjax"] = result
        return result

    def analyze_bootstrap(self) -> dict:
        """Check if Bootstrap is used for styling"""
        result = {
            "score": 0,
            "bootstrap_linked": False,
            "bootstrap_classes_found": [],
            "issues": [],
        }

        html_files = self._get_files_by_extension(".html")
        all_content = ""
        for file in html_files:
            all_content += self._read_file(file) + "\n"

        # Check for Bootstrap CDN/link
        bootstrap_link_patterns = [
            r'bootstrap\.min\.css',
            r'bootstrap\.css',
            r'cdn.*bootstrap',
        ]
        for pattern in bootstrap_link_patterns:
            if re.search(pattern, all_content, re.IGNORECASE):
                result["bootstrap_linked"] = True
                break

        # Check for Bootstrap classes
        for cls in self.BOOTSTRAP_CLASSES:
            pattern = rf'class\s*=\s*["\'][^"\']*{cls}[^"\']*["\']'
            if re.search(pattern, all_content):
                result["bootstrap_classes_found"].append(cls)

        # Scoring logic
        if result["bootstrap_linked"] and len(result["bootstrap_classes_found"]) >= 3:
            result["score"] = 10
        elif result["bootstrap_linked"] and len(result["bootstrap_classes_found"]) > 0:
            result["score"] = 7
        elif len(result["bootstrap_classes_found"]) > 0:
            result["score"] = 4
        else:
            result["score"] = 0
            result["issues"].append("NO_BOOTSTRAP")

        self.analysis_result["bootstrap"] = result
        return result

    def analyze_prepared_statements(self) -> dict:
        """Check if prepared statements are used for SQL queries"""
        result = {
            "score": 10,
            "prepared_statements": 0,
            "raw_sql_queries": 0,
            "issues": [],
        }

        php_files = self._get_files_by_extension(".php")
        all_content = ""
        for file in php_files:
            all_content += self._read_file(file) + "\n"

        # Check for prepared statements (both OOP and procedural styles)
        prepared_patterns = [
            # Object-oriented style
            r'->prepare\s*\(',
            r'->bind_param\s*\(',
            r'->bindParam\s*\(',
            # Procedural style (mysqli)
            r'mysqli_stmt_prepare\s*\(',
            r'mysqli_prepare\s*\(',
            r'mysqli_stmt_bind_param\s*\(',
            r'mysqli_bind_param\s*\(',
            # PDO named parameters
            r':\w+\s*\)',
        ]
        for pattern in prepared_patterns:
            matches = re.findall(pattern, all_content)
            result["prepared_statements"] += len(matches)

        # Check for raw SQL with variable interpolation
        raw_sql_patterns = [
            r'\$_(GET|POST|REQUEST)\s*\[[\'"]?\w+[\'"]?\s*\]',  # Direct superglobal in SQL
            r'\$[a-zA-Z_]\w*\s*\.\s*["\'].*?(?:SELECT|INSERT|UPDATE|DELETE)',  # Concatenation
            r'["\'].*?(?:SELECT|INSERT|UPDATE|DELETE).*?\$[a-zA-Z_]\w*',  # Variable in string
        ]
        for pattern in raw_sql_patterns:
            matches = re.findall(pattern, all_content, re.IGNORECASE)
            if matches:
                result["raw_sql_queries"] += len(matches)

        # Scoring logic
        if result["raw_sql_queries"] > 0 and result["prepared_statements"] == 0:
            result["score"] = 0
            result["issues"].append("SQL_INJECTION_RISK")
        elif result["raw_sql_queries"] > 0:
            result["score"] = 5
            result["issues"].append("MIXED_SQL_PREPARED")
        elif result["prepared_statements"] == 0:
            result["score"] = 5  # No SQL found, neutral score

        self.analysis_result["preparedStatements"] = result
        return result

    def analyze_databases(self) -> dict:
        """Check which databases are used"""
        result = {
            "mysql": {"detected": False, "score": 0, "evidence": []},
            "mongodb": {"detected": False, "score": 0, "evidence": []},
            "redis": {"detected": False, "score": 0, "evidence": []},
        }

        php_files = self._get_files_by_extension(".php")
        all_content = ""
        for file in php_files:
            all_content += self._read_file(file) + "\n"

        # MySQL detection
        mysql_patterns = [
            (r'mysqli_connect\s*\(', 'mysqli_connect'),
            (r'new\s+mysqli\s*\(', 'new mysqli'),
            (r'new\s+PDO\s*\([^)]*mysql', 'PDO MySQL'),
            (r'\$conn\s*=\s*mysqli_connect', 'mysqli connection'),
        ]
        for pattern, name in mysql_patterns:
            if re.search(pattern, all_content):
                result["mysql"]["detected"] = True
                result["mysql"]["evidence"].append(name)
        if result["mysql"]["detected"]:
            result["mysql"]["score"] = 8

        # MongoDB detection
        mongodb_patterns = [
            (r'new\s+MongoClient\s*\(', 'MongoClient'),
            (r'new\s+MongoDB\\Client\s*\(', 'MongoDB Client'),
            (r'MongoDB\\Driver', 'MongoDB Driver'),
            (r'\$mongo\s*=', 'mongo variable'),
        ]
        for pattern, name in mongodb_patterns:
            if re.search(pattern, all_content):
                result["mongodb"]["detected"] = True
                result["mongodb"]["evidence"].append(name)
        if result["mongodb"]["detected"]:
            result["mongodb"]["score"] = 8

        # Redis detection
        redis_patterns = [
            (r'new\s+Redis\s*\(', 'Redis class'),
            (r'Predis\\Client', 'Predis'),
            (r'redis\.connect\s*\(', 'redis connect'),
            (r'\$redis\s*=\s*new\s+Redis', 'redis variable'),
        ]
        for pattern, name in redis_patterns:
            if re.search(pattern, all_content):
                result["redis"]["detected"] = True
                result["redis"]["evidence"].append(name)
        if result["redis"]["detected"]:
            result["redis"]["score"] = 5

        self.analysis_result["databases"] = result
        return result

    def analyze_localStorage(self) -> dict:
        """Check if localStorage is used for session management"""
        result = {
            "detected": False,
            "score": 0,
            "evidence": [],
        }

        js_files = self._get_files_by_extension(".js")
        all_content = ""
        for file in js_files:
            all_content += self._read_file(file) + "\n"

        # localStorage patterns
        patterns = [
            (r'localStorage\.setItem\s*\(', 'setItem'),
            (r'localStorage\.getItem\s*\(', 'getItem'),
            (r'localStorage\.removeItem\s*\(', 'removeItem'),
        ]
        for pattern, name in patterns:
            if re.search(pattern, all_content):
                result["detected"] = True
                result["evidence"].append(name)

        if result["detected"]:
            result["score"] = 4

        self.analysis_result["localStorage"] = result
        return result

    def analyze_security(self) -> dict:
        """Check for security best practices"""
        result = {
            "score": 5,
            "password_hashing": False,
            "input_sanitization": False,
            "issues": [],
        }

        php_files = self._get_files_by_extension(".php")
        all_content = ""
        for file in php_files:
            all_content += self._read_file(file) + "\n"

        # Check for password hashing
        if re.search(r'password_hash\s*\(|password_verify\s*\(|bcrypt|PASSWORD_DEFAULT', all_content):
            result["password_hashing"] = True
            result["score"] += 1

        # Check for input sanitization
        if re.search(r'htmlspecialchars|strip_tags|mysqli_real_escape|filter_input', all_content):
            result["input_sanitization"] = True
            result["score"] += 1

        # Cap score at 5
        result["score"] = min(result["score"], 5)

        self.analysis_result["security"] = result
        return result

    def _get_files_by_extension(self, extension: str) -> list:
        """Get all files with a specific extension"""
        files = []
        for root, _, filenames in os.walk(self.repo_path):
            for filename in filenames:
                if filename.endswith(extension):
                    files.append(os.path.join(root, filename))
        return files

    def _read_file(self, file_path: str) -> str:
        """Read file content safely"""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            return ""
