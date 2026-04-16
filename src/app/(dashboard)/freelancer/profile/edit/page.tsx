import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMyFreelancerProfile } from '@/actions/profile-actions';
import { EditProfileForm } from './edit-profile-form';

export default async function EditProfilePage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const profile = await getMyFreelancerProfile();

    if (!profile) {
        redirect('/onboarding/freelancer');
    }

    return <EditProfileForm initialData={profile} />;
}
