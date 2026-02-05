import { redirect } from 'next/navigation';

export default function ClientSettingsPage() {
    redirect('/client/profile/edit');
}
