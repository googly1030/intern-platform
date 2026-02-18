import { useState } from 'react';
import {
  SettingsSection,
  ApiKeyInput,
  TemperatureSlider,
  EmailIntegration,
  TemplateEditor,
  StatusBadge,
} from '../../components/settings';

const Settings = () => {
  // API Config state
  const [apiKey, setApiKey] = useState('sk-ant-api03-Md8zP9qL2kR4sN7jW1xV5bC8nRm0pQ3lK6yH9');
  const [maxTokens, setMaxTokens] = useState(4096);

  // Template state
  const [templates, setTemplates] = useState({
    approve: `Hello {{candidate_name}},
We are pleased to offer you the position of {{role_title}} at DevRecruit.
Please review the attached documents.
Regards,
{{recruiter_name}}`,
    reject: `Dear {{candidate_name}},
Thank you for your interest in the {{role_title}} position.
Unfortunately, we have decided to move forward with other candidates who more closely match our requirements at this time.
Best,
The Team`,
    requestInfo: `Hi {{candidate_name}},
Could you please provide more details regarding your experience with {{missing_skill}}?
We would like to schedule a brief call on {{next_available_slot}}.
Thanks,
{{recruiter_name}}`,
  });

  const handleTestConnection = () => {
    console.log('Testing API connection...');
  };

  const handleDisconnect = () => {
    console.log('Disconnecting email...');
  };

  const handleSaveTemplates = () => {
    console.log('Saving templates...', templates);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* API Configuration Section */}
      <SettingsSection
        title="API_CONFIG"
        subtitle="Manage external AI provider connections"
        icon="api"
        gradient
        statusBadge={
          <StatusBadge status="active" label="Anthropic: Active" color="neon-green" />
        }
      >
        <div className="space-y-6">
          <ApiKeyInput
            label="Anthropic API Key"
            value={apiKey}
            placeholder="sk-ant-..."
            lastRotated="2023-10-15 14:30:00 UTC"
            onTest={handleTestConnection}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">
                Max Tokens
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full bg-black border border-gray-800 text-white font-mono text-sm py-2 px-3 focus:border-primary focus:ring-0 transition-all"
              />
            </div>
            <TemperatureSlider label="Temperature" value={0.7} />
          </div>
        </div>
      </SettingsSection>

      {/* Email Integration Section */}
      <SettingsSection
        title="EMAIL_INTEGRATION"
        subtitle="SMTP / OAuth configuration for notifications"
        icon="mail"
        statusBadge={
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-mono uppercase">Status:</span>
            <span className="text-neon-green text-xs font-mono font-bold text-glow-green">
              LINKED
            </span>
          </div>
        }
      >
        <EmailIntegration
          provider="Gmail OAuth"
          email="recruiting-bot@devrecruit.sh"
          logo="https://lh3.googleusercontent.com/aida-public/AB6AXuDMdPGaFdaLzZCycW2X43AWgigeUj3D9FrroKqJh7KXPUI9INUYbE2Zg1CNARpLiEIF9-x6IqJzWNPZ6yDl1FZF2oNmCYxH41kYVdWvjjYczsEruIBxQH1MePOQB-fOCiifc-fVKMbMAAWEoLwbVrLPLtZLxND3_7gTF6gpam1_2ArUJ-ZhZzNi2Z48U25dZ_uQnsHl6qpf9h_ISNOJVcMEK3Vk2hz3rJF3xYi3N0Vk37H1_DDOaMR7lsZqJVQEa6lGZOTIDtuCalo"
          scopes={['SEND', 'READ_ONLY']}
          onDisconnect={handleDisconnect}
        />
      </SettingsSection>

      {/* Notification Templates Section */}
      <SettingsSection
        title="NOTIFICATION_TEMPLATES"
        subtitle="Handlebars templates for automated responses"
        icon="code"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TemplateEditor
            label="APPROVE_EMAIL"
            subject="Offer Letter"
            icon="check_circle"
            color="neon-green"
            value={templates.approve}
            onChange={(value) => setTemplates({ ...templates, approve: value })}
          />

          <TemplateEditor
            label="REJECT_EMAIL"
            subject="Application Update"
            icon="cancel"
            color="neon-red"
            value={templates.reject}
            onChange={(value) => setTemplates({ ...templates, reject: value })}
          />

          <TemplateEditor
            label="REQUEST_INFO"
            subject="Additional Info Needed"
            icon="help"
            color="neon-amber"
            value={templates.requestInfo}
            onChange={(value) => setTemplates({ ...templates, requestInfo: value })}
          />
        </div>

        {/* Save Footer */}
        <div className="mt-6 flex justify-end items-center gap-4 border-t border-white/5 pt-4">
          <p className="text-[10px] text-gray-500 font-mono">Last autosave: 2 mins ago</p>
          <button
            onClick={handleSaveTemplates}
            className="px-4 py-2 bg-primary text-black font-mono font-bold text-xs hover:bg-white transition-colors shadow-neon-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            SAVE_ALL_TEMPLATES
          </button>
        </div>
      </SettingsSection>
    </div>
  );
};

export default Settings;
