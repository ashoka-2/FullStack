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
            title="API Keys"
            icon={RiKeyLine}
            description="Manage your custom AI provider API keys"
        >
            <CustomKeyManager
                onNotify={(message, type) => dispatch(addToast({ message, type }))}
            />
        </SettingsPageLayout>
    );
};

export default ApiKeysSettingsPage;
