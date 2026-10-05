import React from 'react';
import { RiKeyLine } from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import CustomKeyManager from '../../components/CustomKeyManager';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';

const ApiKeysSettingsPage = () => {
    const dispatch = useDispatch();

    return (
        <SettingsPageLayout
            title="AI Models & API Keys"
            icon={RiKeyLine}
            description="Configure active models or add custom API keys for Gemini, Claude, OpenAI, DeepSeek & Groq"
        >
            <CustomKeyManager
                onNotify={(message, type) => dispatch(addToast({ message, type }))}
            />
        </SettingsPageLayout>
    );
};

export default ApiKeysSettingsPage;
