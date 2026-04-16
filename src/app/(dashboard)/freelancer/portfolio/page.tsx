import { getMyPortfolio } from '@/actions/portfolio-actions';
import { PortfolioClient } from './portfolio-client';

export default async function PortfolioPage() {
    const portfolio = await getMyPortfolio();

    return <PortfolioClient initialPortfolio={JSON.parse(JSON.stringify(portfolio))} />;
}
