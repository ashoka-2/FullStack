import React, { useState } from 'react';
import { RiGhost2Line } from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import MascotCompanionSettings from '../../components/MascotCompanionSettings';

const MascotSettingsPage = () => {
    const [previewMood, setPreviewMood] = useState('curious');
    const [celebrateCount, setCelebrateCount] = useState(0);

    const triggerCelebrate = () => {
        setPreviewMood('love');
        setCelebrateCount(c => c + 1);
        setTimeout(() => setPreviewMood('curious'), 2500);
    };

    return (
        <SettingsPageLayout
            title="Mascot Companion"
            icon={RiGhost2Line}
            description="Customize your floating blob mascot appearance and behavior"
        >
            <MascotCompanionSettings
                previewMood={previewMood}
                setPreviewMood={setPreviewMood}
                celebrateCount={celebrateCount}
            />
        </SettingsPageLayout>
    );
};

export default MascotSettingsPage;
