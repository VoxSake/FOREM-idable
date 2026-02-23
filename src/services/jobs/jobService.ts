import { ForemSearchParams, fetchForemJobs } from '../api/foremClient';
import { Job } from '@/types/job';

/**
 * JobService acts as an abstraction layer across multiple potential job indexers.
 */
export const jobService = {
    searchJobs: async (params: ForemSearchParams): Promise<{ jobs: Job[]; total: number }> => {
        // In the future, we could run multiple providers via Promise.all
        // e.g. return await mergeProviders(fetchForemJobs(params), fetchLinkedIn(params));
        return await fetchForemJobs(params);
    }
};
