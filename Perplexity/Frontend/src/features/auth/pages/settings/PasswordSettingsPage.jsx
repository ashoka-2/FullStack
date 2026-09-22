import React from 'react';
import { RiLockPasswordLine } from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import PasswordChangeForm from '../../components/PasswordChangeForm';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';

const PasswordSettingsPage = () => {
    const dispatch = useDispatch();

    return (
        <SettingsPageLayout
            title="Change Password"
            icon={RiLockPasswordLine}
            description="Update your account password and security settings"
        >
            <PasswordChangeForm
                onSuccess={() => dispatch(addToast({ message: 'Password changed successfully!', type: 'success' }))}
            />
        </SettingsPageLayout>
    );
};

export default PasswordSettingsPage;
