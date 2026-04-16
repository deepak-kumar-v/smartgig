import { getAllPortfolioForAdmin } from '@/actions/portfolio-actions';
import { AdminPortfolioClient } from './admin-portfolio-client';

export default async function AdminPortfolioPage() {
    const items = await getAllPortfolioForAdmin();

    return <AdminPortfolioClient items={JSON.parse(JSON.stringify(items))} />;
}
