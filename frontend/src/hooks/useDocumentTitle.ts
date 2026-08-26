import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | Abhishek Bhardwaj Media`;
    return () => {
      document.title = originalTitle;
    };
  }, [title]);
}
