import React from 'react';
import { RiUserLine } from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import ProfileSettingsForm from '../../components/ProfileSettingsForm';
import { useSelector } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';
import { useDispatch } from 'react-redux';

const ProfileSettingsPage = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();

    return (
        <SettingsPageLayout
            title="Profile"
            icon={RiUserLine}
            description="Manage your display name, avatar and account info"
        >
            <ProfileSettingsForm
                user={user}
                onSuccess={() => dispatch(addToast({ message: 'Profile updated successfully!', type: 'success' }))}
            />
        </SettingsPageLayout>
    );
};

export default ProfileSettingsPage;
