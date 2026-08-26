import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Search as SearchIcon, Filter } from 'lucide-react';

export const SearchPage: React.FC = () => {
  useDocumentTitle('Search News');
  const [query, setQuery] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-white">Search News & Fact-Checks</h1>
        <p className="text-xs text-slate-400">
          Search across Palamu, Garhwa, Latehar, and state-wide Jharkhand news coverage.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search by keywords, topic, location, or tag..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<SearchIcon className="w-4 h-4" />}
        />
        <Button variant="primary">Search</Button>
      </div>

      {!query ? (
        <EmptyState
          title="Start searching"
          description="Enter a topic, district name (e.g. Garhwa, Palamu), or keyword above to find verified news stories."
          icon={<SearchIcon className="w-7 h-7 text-rose-500" />}
        />
      ) : (
        <EmptyState
          title={`No results found for "${query}"`}
          description="Try broadening your search term or check spelling."
        />
      )}
    </div>
  );
};
