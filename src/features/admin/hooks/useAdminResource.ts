"use client";

import { useCallback, useState } from "react";

interface ApiResponse<T> {
  response: Response;
  data: T;
}

export function useAdminResource<T>({
  isAuthorized,
  fetchFn,
  extract,
  errorMessage,
}: {
  isAuthorized: boolean;
  fetchFn: () => Promise<ApiResponse<Record<string, unknown>>>;
  extract: (data: Record<string, unknown>) => T[] | undefined;
  errorMessage: string;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthorized) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const { response, data } = await fetchFn();
      const extracted = extract(data);

      if (!response.ok || !extracted) {
        setFeedback((data.error as string | undefined) || errorMessage);
        return;
      }

      setItems(extracted);
    } catch {
      setFeedback(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized, fetchFn, extract, errorMessage]);

  return {
    items,
    setItems,
    feedback,
    setFeedback,
    isLoading,
    load,
  };
}
