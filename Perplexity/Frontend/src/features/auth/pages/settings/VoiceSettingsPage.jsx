import React from 'react';
import { RiVoiceprintLine } from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import VoiceSettingsForm from '../../components/VoiceSettingsForm';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';

const VoiceSettingsPage = () => {
    const dispatch = useDispatch();

    return (
        <SettingsPageLayout
            title="Voice & Speech"
            icon={RiVoiceprintLine}
            description="Configure AI voice responses and speech recognition settings"
        >
            <VoiceSettingsForm
                onSuccess={() => dispatch(addToast({ message: 'Voice settings saved!', type: 'success' }))}
            />
        </SettingsPageLayout>
    );
};

export default VoiceSettingsPage;
