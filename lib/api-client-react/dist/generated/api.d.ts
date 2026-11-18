import type { DataTag, DefinedInitialDataOptions, DefinedUseQueryResult, QueryClient, QueryKey, UndefinedInitialDataOptions, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AdminAccess, AdminSession, AdminSummary, HealthStatus, Inquiry, InquiryInput, InquiryUpdate, SiteContent, SubmissionResult, UploadInput, UploadResult } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getGetSiteUrl: () => string;
export declare const getSite: (options?: Parameters<typeof customFetch>[1]) => Promise<SiteContent>;
export declare const getGetSiteQueryKey: () => readonly ["/api/site"];
export declare const getGetSiteQueryOptions: <TData = Awaited<ReturnType<typeof getSite>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getSite>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSite>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type GetSiteQueryResult = NonNullable<Awaited<ReturnType<typeof getSite>>>;
export type GetSiteQueryError = ErrorType<unknown>;
export declare function useGetSite<TData = Awaited<ReturnType<typeof getSite>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof getSite>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof getSite>>, TError, Awaited<ReturnType<typeof getSite>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetSite<TData = Awaited<ReturnType<typeof getSite>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getSite>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof getSite>>, TError, Awaited<ReturnType<typeof getSite>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetSite<TData = Awaited<ReturnType<typeof getSite>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getSite>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getSubmitInquiryUrl: () => string;
export declare const submitInquiry: (inquiryInput: InquiryInput, options?: Parameters<typeof customFetch>[1]) => Promise<SubmissionResult>;
export declare const getSubmitInquiryMutationKey: () => readonly ["submitInquiry"];
export declare const getSubmitInquiryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitInquiry>>, TError, SubmitInquiryMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitInquiry>>, TError, SubmitInquiryMutationVariables, TContext>;
export type SubmitInquiryMutationResult = NonNullable<Awaited<ReturnType<typeof submitInquiry>>>;
export type SubmitInquiryMutationBody = BodyType<InquiryInput>;
export type SubmitInquiryMutationError = ErrorType<unknown>;
export type SubmitInquiryMutationVariables = {
    data: BodyType<InquiryInput>;
};
export declare const useSubmitInquiry: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitInquiry>>, TError, SubmitInquiryMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof submitInquiry>>, TError, SubmitInquiryMutationVariables, TContext>;
export declare const getGetAdminSessionUrl: () => string;
export declare const getAdminSession: (options?: Parameters<typeof customFetch>[1]) => Promise<AdminSession>;
export declare const getGetAdminSessionQueryKey: () => readonly ["/api/admin/session"];
export declare const getGetAdminSessionQueryOptions: <TData = Awaited<ReturnType<typeof getAdminSession>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminSession>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminSession>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type GetAdminSessionQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminSession>>>;
export type GetAdminSessionQueryError = ErrorType<unknown>;
export declare function useGetAdminSession<TData = Awaited<ReturnType<typeof getAdminSession>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminSession>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof getAdminSession>>, TError, Awaited<ReturnType<typeof getAdminSession>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetAdminSession<TData = Awaited<ReturnType<typeof getAdminSession>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminSession>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof getAdminSession>>, TError, Awaited<ReturnType<typeof getAdminSession>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetAdminSession<TData = Awaited<ReturnType<typeof getAdminSession>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminSession>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getSaveSiteUrl: () => string;
export declare const saveSite: (siteContent: SiteContent, options?: Parameters<typeof customFetch>[1]) => Promise<SiteContent>;
export declare const getSaveSiteMutationKey: () => readonly ["saveSite"];
export declare const getSaveSiteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveSite>>, TError, SaveSiteMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof saveSite>>, TError, SaveSiteMutationVariables, TContext>;
export type SaveSiteMutationResult = NonNullable<Awaited<ReturnType<typeof saveSite>>>;
export type SaveSiteMutationBody = BodyType<SiteContent>;
export type SaveSiteMutationError = ErrorType<unknown>;
export type SaveSiteMutationVariables = {
    data: BodyType<SiteContent>;
};
export declare const useSaveSite: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveSite>>, TError, SaveSiteMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof saveSite>>, TError, SaveSiteMutationVariables, TContext>;
export declare const getListInquiriesUrl: () => string;
export declare const listInquiries: (options?: Parameters<typeof customFetch>[1]) => Promise<Inquiry[]>;
export declare const getListInquiriesQueryKey: () => readonly ["/api/admin/inquiries"];
export declare const getListInquiriesQueryOptions: <TData = Awaited<ReturnType<typeof listInquiries>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listInquiries>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listInquiries>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type ListInquiriesQueryResult = NonNullable<Awaited<ReturnType<typeof listInquiries>>>;
export type ListInquiriesQueryError = ErrorType<unknown>;
export declare function useListInquiries<TData = Awaited<ReturnType<typeof listInquiries>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof listInquiries>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof listInquiries>>, TError, Awaited<ReturnType<typeof listInquiries>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListInquiries<TData = Awaited<ReturnType<typeof listInquiries>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listInquiries>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof listInquiries>>, TError, Awaited<ReturnType<typeof listInquiries>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListInquiries<TData = Awaited<ReturnType<typeof listInquiries>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listInquiries>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getUpdateInquiryUrl: (id: number) => string;
export declare const updateInquiry: (id: number, inquiryUpdate: InquiryUpdate, options?: Parameters<typeof customFetch>[1]) => Promise<Inquiry>;
export declare const getUpdateInquiryMutationKey: () => readonly ["updateInquiry"];
export declare const getUpdateInquiryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateInquiry>>, TError, UpdateInquiryMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateInquiry>>, TError, UpdateInquiryMutationVariables, TContext>;
export type UpdateInquiryMutationResult = NonNullable<Awaited<ReturnType<typeof updateInquiry>>>;
export type UpdateInquiryMutationBody = BodyType<InquiryUpdate>;
export type UpdateInquiryMutationError = ErrorType<unknown>;
export type UpdateInquiryMutationVariables = {
    id: number;
    data: BodyType<InquiryUpdate>;
};
export declare const useUpdateInquiry: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateInquiry>>, TError, UpdateInquiryMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof updateInquiry>>, TError, UpdateInquiryMutationVariables, TContext>;
export declare const getDeleteInquiryUrl: (id: number) => string;
export declare const deleteInquiry: (id: number, options?: Parameters<typeof customFetch>[1]) => Promise<void>;
export declare const getDeleteInquiryMutationKey: () => readonly ["deleteInquiry"];
export declare const getDeleteInquiryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteInquiry>>, TError, DeleteInquiryMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteInquiry>>, TError, DeleteInquiryMutationVariables, TContext>;
export type DeleteInquiryMutationResult = NonNullable<Awaited<ReturnType<typeof deleteInquiry>>>;
export type DeleteInquiryMutationError = ErrorType<unknown>;
export type DeleteInquiryMutationVariables = {
    id: number;
};
export declare const useDeleteInquiry: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteInquiry>>, TError, DeleteInquiryMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof deleteInquiry>>, TError, DeleteInquiryMutationVariables, TContext>;
export declare const getGetAdminSummaryUrl: () => string;
export declare const getAdminSummary: (options?: Parameters<typeof customFetch>[1]) => Promise<AdminSummary>;
export declare const getGetAdminSummaryQueryKey: () => readonly ["/api/admin/summary"];
export declare const getGetAdminSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getAdminSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminSummary>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminSummary>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type GetAdminSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminSummary>>>;
export type GetAdminSummaryQueryError = ErrorType<unknown>;
export declare function useGetAdminSummary<TData = Awaited<ReturnType<typeof getAdminSummary>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminSummary>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof getAdminSummary>>, TError, Awaited<ReturnType<typeof getAdminSummary>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetAdminSummary<TData = Awaited<ReturnType<typeof getAdminSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminSummary>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof getAdminSummary>>, TError, Awaited<ReturnType<typeof getAdminSummary>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetAdminSummary<TData = Awaited<ReturnType<typeof getAdminSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminSummary>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getGetAdminAccessUrl: () => string;
export declare const getAdminAccess: (options?: Parameters<typeof customFetch>[1]) => Promise<AdminAccess>;
export declare const getGetAdminAccessQueryKey: () => readonly ["/api/admin/access"];
export declare const getGetAdminAccessQueryOptions: <TData = Awaited<ReturnType<typeof getAdminAccess>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminAccess>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminAccess>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type GetAdminAccessQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminAccess>>>;
export type GetAdminAccessQueryError = ErrorType<unknown>;
export declare function useGetAdminAccess<TData = Awaited<ReturnType<typeof getAdminAccess>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminAccess>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof getAdminAccess>>, TError, Awaited<ReturnType<typeof getAdminAccess>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetAdminAccess<TData = Awaited<ReturnType<typeof getAdminAccess>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminAccess>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof getAdminAccess>>, TError, Awaited<ReturnType<typeof getAdminAccess>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetAdminAccess<TData = Awaited<ReturnType<typeof getAdminAccess>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminAccess>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getSaveAdminAccessUrl: () => string;
export declare const saveAdminAccess: (adminAccess: AdminAccess, options?: Parameters<typeof customFetch>[1]) => Promise<AdminAccess>;
export declare const getSaveAdminAccessMutationKey: () => readonly ["saveAdminAccess"];
export declare const getSaveAdminAccessMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveAdminAccess>>, TError, SaveAdminAccessMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof saveAdminAccess>>, TError, SaveAdminAccessMutationVariables, TContext>;
export type SaveAdminAccessMutationResult = NonNullable<Awaited<ReturnType<typeof saveAdminAccess>>>;
export type SaveAdminAccessMutationBody = BodyType<AdminAccess>;
export type SaveAdminAccessMutationError = ErrorType<unknown>;
export type SaveAdminAccessMutationVariables = {
    data: BodyType<AdminAccess>;
};
export declare const useSaveAdminAccess: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveAdminAccess>>, TError, SaveAdminAccessMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof saveAdminAccess>>, TError, SaveAdminAccessMutationVariables, TContext>;
export declare const getRequestUploadUrlUrl: () => string;
export declare const requestUploadUrl: (uploadInput: UploadInput, options?: Parameters<typeof customFetch>[1]) => Promise<UploadResult>;
export declare const getRequestUploadUrlMutationKey: () => readonly ["requestUploadUrl"];
export declare const getRequestUploadUrlMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
export type RequestUploadUrlMutationResult = NonNullable<Awaited<ReturnType<typeof requestUploadUrl>>>;
export type RequestUploadUrlMutationBody = BodyType<UploadInput>;
export type RequestUploadUrlMutationError = ErrorType<unknown>;
export type RequestUploadUrlMutationVariables = {
    data: BodyType<UploadInput>;
};
export declare const useRequestUploadUrl: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof healthCheck>>, TError, Awaited<ReturnType<typeof healthCheck>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof healthCheck>>, TError, Awaited<ReturnType<typeof healthCheck>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export {};
//# sourceMappingURL=api.d.ts.map