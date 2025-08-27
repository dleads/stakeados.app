import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Proposals - Stakeados',
    description: 'Manage article proposals and submissions',
  };
}

export default function ProposalsPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Proposals Management
        </h1>
        <p className="text-gray-300">
          Proposal management dashboard coming soon...
        </p>
      </div>
    </div>
  );
}
