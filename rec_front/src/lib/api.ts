// // src/lib/api.ts
// import { 
//   Candidate, 
//   Company, 
//   Job, 
//   User, 
//   Office, 
//   Skill,
//   Conversation,
//   ConversationWithMessages,
//   Message,
//   CreateMessageDto,
//   CreateConversationDto,
//   UnreadCount
// } from '@/types';

// // API base URL from environment variables
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// // Helper function to handle API responses
// const handleResponse = async (response: Response) => {
//   // Handle redirects (307, 301, 302, etc.)
//   if (response.redirected) {
//     console.warn(`API request redirected from ${response.url}`);
//   }
  
//   if (!response.ok) {
//     // For redirects, provide a more specific error message
//     if (response.status >= 300 && response.status < 400) {
//       throw new Error(`Redirect error: ${response.status} ${response.statusText}`);
//     }
    
//     // For other errors, try to parse the response body
//     const error = await response.json().catch(() => ({ detail: response.statusText }));
//     throw new Error(error.detail || `Error ${response.status}: ${response.statusText}`);
//   }
  
//   return response.json();
// };

// // Generic fetcher function
// const fetcher = async <T>(
//   endpoint: string,
//   options: RequestInit = {}
// ): Promise<T> => {
//   try {
//     const url = `${API_BASE_URL}${endpoint}`;
    
//     // Add cache control headers to prevent caching of API responses
//     const headers = {
//       'Content-Type': 'application/json',
//       'Cache-Control': 'no-cache, no-store, must-revalidate',
//       'Pragma': 'no-cache',
//       'Expires': '0',
//       ...options.headers,
//     };
    
//     // Set maximum timeout for requests
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
//     const response = await fetch(url, {
//       headers,
//       ...options,
//       signal: controller.signal,
//     });
    
//     clearTimeout(timeoutId);
    
//     return handleResponse(response);
//   } catch (error) {
//     if (error instanceof DOMException && error.name === 'AbortError') {
//       console.error('API request timed out');
//       throw new Error('Request timed out. Please try again.');
//     }
//     console.error('API Error:', error);
//     throw error;
//   }
// };

// // Helper to extract items from paginated responses
// const extractPaginatedItems = <T>(response: { items: T[], totalCount: number, page: number, pageSize: number, pageCount: number }): T[] => {
//   return response.items;
// };

// // API Service
// export const api = {
//   // Messages and Conversations
//   messages: {
//     getConversations: async (userId: string, skip = 0, limit = 100) => {
//       try {
//         const response = await fetcher<Conversation[]>(`/api/v1/messages/conversations?user_id=${userId}&skip=${skip}&limit=${limit}`);
//         return response;
//       } catch (error) {
//         console.error('Failed to fetch conversations:', error);
//         throw error;
//       }
//     },
    
//     getConversation: async (conversationId: string) => {
//       try {
//         const response = await fetcher<ConversationWithMessages>(`/api/v1/messages/conversations/${conversationId}`);
//         return response;
//       } catch (error) {
//         console.error('Failed to fetch conversation:', error);
//         throw error;
//       }
//     },
    
//     createConversation: async (data: CreateConversationDto) => {
//       try {
//         const response = await fetcher<Conversation>('/api/v1/messages/conversations/', {
//           method: 'POST',
//           body: JSON.stringify(data),
//         });
//         return response;
//       } catch (error) {
//         console.error('Failed to create conversation:', error);
//         throw error;
//       }
//     },
    
//     getMessages: async (params: {
//       conversation_id?: string;
//       user_id?: string;
//       skip?: number;
//       limit?: number;
//     }) => {
//       try {
//         let query = '/api/v1/messages/messages?';
        
//         if (params.conversation_id) {
//           query += `conversation_id=${params.conversation_id}&`;
//         }
        
//         if (params.user_id) {
//           query += `user_id=${params.user_id}&`;
//         }
        
//         if (params.skip !== undefined) {
//           query += `skip=${params.skip}&`;
//         }
        
//         if (params.limit !== undefined) {
//           query += `limit=${params.limit}&`;
//         }
        
//         const response = await fetcher<Message[]>(query);
//         return response;
//       } catch (error) {
//         console.error('Failed to fetch messages:', error);
//         throw error;
//       }
//     },
    
//     createMessage: async (data: CreateMessageDto) => {
//       try {
//         const response = await fetcher<Message>('/api/v1/messages/messages/', {
//           method: 'POST',
//           body: JSON.stringify(data),
//         });
//         return response;
//       } catch (error) {
//         console.error('Failed to create message:', error);
//         throw error;
//       }
//     },
    
//     markMessageAsRead: async (messageId: string, userId: string) => {
//       try {
//         const response = await fetcher<Message>(`/api/v1/messages/messages/${messageId}/read?user_id=${userId}`, {
//           method: 'PUT',
//         });
//         return response;
//       } catch (error) {
//         console.error('Failed to mark message as read:', error);
//         throw error;
//       }
//     },
    
//     getUnreadCount: async (userId: string) => {
//       try {
//         const response = await fetcher<UnreadCount>(`/api/v1/messages/messages/unread/count?user_id=${userId}`);
//         return response.count;
//       } catch (error) {
//         console.error('Failed to get unread count:', error);
//         throw error;
//       }
//     },
//   },
  
//   // Candidates
//   candidates: {
//     getAll: async (officeId?: string, search?: string, skill?: string, status?: string, page = 1, limit = 50) => {
//       try {
//         let endpoint = '/api/v1/candidates?';
        
//         if (officeId) endpoint += `office_id=${officeId}&`;
//         if (search) endpoint += `search=${encodeURIComponent(search)}&`;
//         if (skill) endpoint += `skill=${encodeURIComponent(skill)}&`;
//         if (status) endpoint += `status=${status}&`;
        
//         endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
        
//         const response = await fetcher<{
//           items: Candidate[],
//           totalCount: number,
//           page: number,
//           pageSize: number,
//           pageCount: number
//         }>(endpoint);
        
//         // Ensure all date fields are properly converted to Date objects
//         const candidates = response.items.map(candidate => ({
//           ...candidate,
//           createdAt: candidate.createdAt instanceof Date ? candidate.createdAt : new Date(candidate.createdAt),
//           updatedAt: candidate.updatedAt instanceof Date ? candidate.updatedAt : new Date(candidate.updatedAt),
//         }));
        
//         return {
//           items: candidates,
//           totalCount: response.totalCount,
//           page: response.page,
//           pageSize: response.pageSize,
//           pageCount: response.pageCount
//         };
//       } catch (error) {
//         console.error('Failed to fetch candidates:', error);
//         throw error;
//       }
//     },
      
//     getById: async (id: string) => {
//       try {
//         const candidate = await fetcher<Candidate>(`/api/v1/candidates/${id}`);
        
//         return {
//           ...candidate,
//           createdAt: candidate.createdAt instanceof Date ? candidate.createdAt : new Date(candidate.createdAt),
//           updatedAt: candidate.updatedAt instanceof Date ? candidate.updatedAt : new Date(candidate.updatedAt),
//         };
//       } catch (error) {
//         console.error('Failed to fetch candidate:', error);
//         throw error;
//       }
//     },
      
//     create: async (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => {
//       try {
//         const newCandidate = await fetcher<Candidate>('/api/v1/candidates/', {
//           method: 'POST',
//           body: JSON.stringify(candidate),
//         });
        
//         return {
//           ...newCandidate,
//           createdAt: newCandidate.createdAt instanceof Date ? newCandidate.createdAt : new Date(newCandidate.createdAt),
//           updatedAt: newCandidate.updatedAt instanceof Date ? newCandidate.updatedAt : new Date(newCandidate.updatedAt),
//         };
//       } catch (error) {
//         console.error('Failed to create candidate:', error);
//         throw error;
//       }
//     },
      
//     update: async (id: string, updates: Partial<Candidate>) => {
//       try {
//         const updatedCandidate = await fetcher<Candidate>(`/api/v1/candidates/${id}`, {
//           method: 'PUT',
//           body: JSON.stringify(updates),
//         });
        
//         return {
//           ...updatedCandidate,
//           createdAt: updatedCandidate.createdAt instanceof Date ? updatedCandidate.createdAt : new Date(updatedCandidate.createdAt),
//           updatedAt: updatedCandidate.updatedAt instanceof Date ? updatedCandidate.updatedAt : new Date(updatedCandidate.updatedAt),
//         };
//       } catch (error) {
//         console.error('Failed to update candidate:', error);
//         throw error;
//       }
//     },
      
//     delete: async (id: string) => {
//       try {
//         const result = await fetcher<{ success: boolean }>(`/api/v1/candidates/${id}`, {
//           method: 'DELETE',
//         });
        
//         return result.success;
//       } catch (error) {
//         console.error('Failed to delete candidate:', error);
//         throw error;
//       }
//     },
//   },
  
//   // Companies
//   companies: {
//     getAll: async (officeId?: string, industry?: string, search?: string, hasOpenPositions?: boolean, page = 1, limit = 50) => {
//       try {
//         let endpoint = '/api/v1/companies?';
        
//         if (officeId) endpoint += `office_id=${officeId}&`;
//         if (industry) endpoint += `industry=${encodeURIComponent(industry)}&`;
//         if (search) endpoint += `search=${encodeURIComponent(search)}&`;
//         if (hasOpenPositions !== undefined) endpoint += `has_open_positions=${hasOpenPositions}&`;
        
//         endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
        
//         const response = await fetcher<{
//           items: Company[],
//           totalCount: number,
//           page: number,
//           pageSize: number,
//           pageCount: number
//         }>(endpoint);
        
//         // Ensure all date fields are properly converted to Date objects
//         const companies = response.items.map(company => ({
//           ...company,
//           createdAt: company.createdAt instanceof Date ? company.createdAt : new Date(company.createdAt),
//           updatedAt: company.updatedAt instanceof Date ? company.updatedAt : new Date(company.updatedAt),
//         }));
        
//         return {
//           items: companies,
//           totalCount: response.totalCount,
//           page: response.page,
//           pageSize: response.pageSize,
//           pageCount: response.pageCount
//         };
//       } catch (error) {
//         console.error('Failed to fetch companies:', error);
//         throw error;
//       }
//     },
      
//     getById: async (id: string) => {
//       try {
//         const company = await fetcher<Company>(`/api/v1/companies/${id}`);
        
//         return {
//           ...company,
//           createdAt: company.createdAt instanceof Date ? company.createdAt : new Date(company.createdAt),
//           updatedAt: company.updatedAt instanceof Date ? company.updatedAt : new Date(company.updatedAt),
//         };
//       } catch (error) {
//         console.error('Failed to fetch company:', error);
//         throw error;
//       }
//     },
    
//     getJobsByCompany: async (companyId: string) => {
//       try {
//         const response = await fetcher<{ jobs: Job[], total: number }>(`/api/v1/companies/${companyId}/jobs`);
        
//         // Ensure all date fields are properly converted to Date objects
//         const jobs = response.jobs.map(job => ({
//           ...job,
//           createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
//           updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
//           deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
//         }));
        
//         return {
//           jobs,
//           total: response.total
//         };
//       } catch (error) {
//         console.error('Failed to fetch company jobs:', error);
//         throw error;
//       }
//     },
      
//     create: async (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
//       try {
//         const newCompany = await fetcher<Company>('/api/v1/companies/', {
//           method: 'POST',
//           body: JSON.stringify(company),
//         });
        
//         return {
//           ...newCompany,
//           createdAt: newCompany.createdAt instanceof Date ? newCompany.createdAt : new Date(newCompany.createdAt),
//           updatedAt: newCompany.updatedAt instanceof Date ? newCompany.updatedAt : new Date(newCompany.updatedAt),
//         };
//       } catch (error) {
//         console.error('Failed to create company:', error);
//         throw error;
//       }
//     },
      
//     update: async (id: string, updates: Partial<Company>) => {
//       try {
//         const updatedCompany = await fetcher<Company>(`/api/v1/companies/${id}`, {
//           method: 'PUT',
//           body: JSON.stringify(updates),
//         });
        
//         return {
//           ...updatedCompany,
//           createdAt: updatedCompany.createdAt instanceof Date ? updatedCompany.createdAt : new Date(updatedCompany.createdAt),
//           updatedAt: updatedCompany.updatedAt instanceof Date ? updatedCompany.updatedAt : new Date(updatedCompany.updatedAt),
//         };
//       } catch (error) {
//         console.error('Failed to update company:', error);
//         throw error;
//       }
//     },
      
//     delete: async (id: string) => {
//       try {
//         const result = await fetcher<{ success: boolean }>(`/api/v1/companies/${id}`, {
//           method: 'DELETE',
//         });
        
//         return result.success;
//       } catch (error) {
//         console.error('Failed to delete company:', error);
//         throw error;
//       }
//     },
//   },
  
//   // Jobs
//   jobs: {
//     getAll: async (officeId?: string, companyId?: string, status?: string, skill?: string, search?: string, page = 1, limit = 50) => {
//       try {
//         let endpoint = '/api/v1/jobs?';
        
//         if (officeId) endpoint += `office_id=${officeId}&`;
//         if (companyId) endpoint += `company_id=${companyId}&`;
//         if (status) endpoint += `status=${status}&`;
//         if (skill) endpoint += `skill=${encodeURIComponent(skill)}&`;
//         if (search) endpoint += `search=${encodeURIComponent(search)}&`;
        
//         endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
        
//         const response = await fetcher<{
//           items: Job[],
//           totalCount: number,
//           page: number,
//           pageSize: number,
//           pageCount: number
//         }>(endpoint);
        
//         // Ensure all date fields are properly converted to Date objects
//         const jobs = response.items.map(job => ({
//           ...job,
//           createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
//           updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
//           deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
//           postedAt: job.postedAt ? (job.postedAt instanceof Date ? job.postedAt : new Date(job.postedAt)) : undefined,
//         }));
        
//         return {
//           items: jobs,
//           totalCount: response.totalCount,
//           page: response.page,
//           pageSize: response.pageSize,
//           pageCount: response.pageCount
//         };
//       } catch (error) {
//         console.error('Failed to fetch jobs:', error);
//         throw error;
//       }
//     },
      
//     getById: async (id: string) => {
//       try {
//         const job = await fetcher<Job>(`/api/v1/jobs/${id}`);
        
//         return {
//           ...job,
//           createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
//           updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
//           deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
//           postedAt: job.postedAt ? (job.postedAt instanceof Date ? job.postedAt : new Date(job.postedAt)) : undefined,
//         };
//       } catch (error) {
//         console.error('Failed to fetch job:', error);
//         throw error;
//       }
//     },
      
//     getByCompany: async (companyId: string) => {
//       try {
//         const jobs = await fetcher<Job[]>(`/api/v1/companies/${companyId}/jobs`);
        
//         return jobs.map(job => ({
//           ...job,
//           createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
//           updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
//           deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
//           postedAt: job.postedAt ? (job.postedAt instanceof Date ? job.postedAt : new Date(job.postedAt)) : undefined,
//         }));
//       } catch (error) {
//         console.error('Failed to fetch company jobs:', error);
//         throw error;
//       }
//     },
      
//     create: async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
//       try {
//         const newJob = await fetcher<Job>('/api/v1/jobs/', {
//           method: 'POST',
//           body: JSON.stringify(job),
//         });
        
//         return {
//           ...newJob,
//           createdAt: newJob.createdAt instanceof Date ? newJob.createdAt : new Date(newJob.createdAt),
//           updatedAt: newJob.updatedAt instanceof Date ? newJob.updatedAt : new Date(newJob.updatedAt),
//           deadline: newJob.deadline ? (newJob.deadline instanceof Date ? newJob.deadline : new Date(newJob.deadline)) : undefined,
//           postedAt: newJob.postedAt ? (newJob.postedAt instanceof Date ? newJob.postedAt : new Date(newJob.postedAt)) : undefined,
//         };
//       } catch (error) {
//         console.error('Failed to create job:', error);
//         throw error;
//       }
//     },
      
//     update: async (id: string, updates: Partial<Job>) => {
//       try {
//         const updatedJob = await fetcher<Job>(`/api/v1/jobs/${id}`, {
//           method: 'PUT',
//           body: JSON.stringify(updates),
//         });
        
//         return {
//           ...updatedJob,
//           createdAt: updatedJob.createdAt instanceof Date ? updatedJob.createdAt : new Date(updatedJob.createdAt),
//           updatedAt: updatedJob.updatedAt instanceof Date ? updatedJob.updatedAt : new Date(updatedJob.updatedAt),
//           deadline: updatedJob.deadline ? (updatedJob.deadline instanceof Date ? updatedJob.deadline : new Date(updatedJob.deadline)) : undefined,
//           postedAt: updatedJob.postedAt ? (updatedJob.postedAt instanceof Date ? updatedJob.postedAt : new Date(updatedJob.postedAt)) : undefined,
//         };
//       } catch (error) {
//         console.error('Failed to update job:', error);
//         throw error;
//       }
//     },
      
//     delete: async (id: string) => {
//       try {
//         const result = await fetcher<{ success: boolean }>(`/api/v1/jobs/${id}`, {
//           method: 'DELETE',
//         });
        
//         return result.success;
//       } catch (error) {
//         console.error('Failed to delete job:', error);
//         throw error;
//       }
//     },
//   },
  
//   // Users
//   users: {
//     getAll: async (officeId?: string, role?: string, search?: string, active?: boolean, page = 1, limit = 50) => {
//       try {
//         let endpoint = '/api/v1/users?';
        
//         if (officeId) endpoint += `office_id=${officeId}&`;
//         if (role) endpoint += `role=${role}&`;
//         if (search) endpoint += `search=${encodeURIComponent(search)}&`;
//         if (active !== undefined) endpoint += `active=${active}&`;
        
//         endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
        
//         const response = await fetcher<{
//           items: User[],
//           totalCount: number,
//           page: number,
//           pageSize: number,
//           pageCount: number
//         }>(endpoint);
        
//         // Ensure all date fields are properly converted to Date objects
//         const users = response.items.map(user => ({
//           ...user,
//           createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
//           updatedAt: user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt),
//           lastLogin: user.lastLogin ? (user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin)) : undefined,
//         }));
        
//         return {
//           items: users,
//           totalCount: response.totalCount,
//           page: response.page,
//           pageSize: response.pageSize,
//           pageCount: response.pageCount
//         };
//       } catch (error) {
//         console.error('Failed to fetch users:', error);
//         throw error;
//       }
//     },
      
//     getById: async (id: string) => {
//       try {
//         const user = await fetcher<User>(`/api/v1/users/${id}`);
        
//         return {
//           ...user,
//           createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
//           updatedAt: user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt),
//           lastLogin: user.lastLogin ? (user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin)) : undefined,
//         };
//       } catch (error) {
//         console.error('Failed to fetch user:', error);
//         throw error;
//       }
//     },
    
//     login: async (email: string, password: string) => {
//       try {
//         const response = await fetcher<{
//           user: User,
//           token: string,
//           tokenExpiry: number
//         }>('/api/v1/users/login', {
//           method: 'POST',
//           body: JSON.stringify({ email, password }),
//         });
        
//         // Store token in localStorage
//         if (typeof window !== 'undefined') {
//           localStorage.setItem('auth_token', response.token);
//           localStorage.setItem('auth_expiry', response.tokenExpiry.toString());
//         }
        
//         return {
//           user: {
//             ...response.user,
//             createdAt: response.user.createdAt instanceof Date ? response.user.createdAt : new Date(response.user.createdAt),
//             updatedAt: response.user.updatedAt instanceof Date ? response.user.updatedAt : new Date(response.user.updatedAt),
//             lastLogin: response.user.lastLogin ? (response.user.lastLogin instanceof Date ? response.user.lastLogin : new Date(response.user.lastLogin)) : undefined,
//           },
//           token: response.token,
//           tokenExpiry: response.tokenExpiry
//         };
//       } catch (error) {
//         console.error('Failed to login:', error);
//         throw error;
//       }
//     },
    
//     logout: () => {
//       if (typeof window !== 'undefined') {
//         localStorage.removeItem('auth_token');
//         localStorage.removeItem('auth_expiry');
//       }
//       return Promise.resolve(true);
//     }
//   },
  
//   // Skills
//   skills: {
//     getAll: async (category?: string, search?: string, page = 1, limit = 100) => {
//       try {
//         let endpoint = '/api/v1/skills?';
        
//         if (category) endpoint += `category=${encodeURIComponent(category)}&`;
//         if (search) endpoint += `search=${encodeURIComponent(search)}&`;
        
//         endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
        
//         const response = await fetcher<{
//           items: Skill[],
//           totalCount: number,
//           page: number,
//           pageSize: number,
//           pageCount: number
//         }>(endpoint);
        
//         return {
//           items: response.items,
//           totalCount: response.totalCount,
//           page: response.page,
//           pageSize: response.pageSize,
//           pageCount: response.pageCount
//         };
//       } catch (error) {
//         console.error('Failed to fetch skills:', error);
//         throw error;
//       }
//     },
    
//     getById: async (id: string) => {
//       try {
//         return await fetcher<Skill>(`/api/v1/skills/${id}`);
//       } catch (error) {
//         console.error('Failed to fetch skill:', error);
//         throw error;
//       }
//     }
//   },
  
//   // Offices
//   offices: {
//     getAll: async () => {
//       try {
//         const offices = await fetcher<Office[]>('/api/v1/offices');
        
//         return offices.map(office => ({
//           ...office,
//           createdAt: office.createdAt instanceof Date ? office.createdAt : new Date(office.createdAt),
//           updatedAt: office.updatedAt instanceof Date ? office.updatedAt : new Date(office.updatedAt),
//         }));
//       } catch (error) {
//         console.error('Failed to fetch offices:', error);
//         // For now, return mock offices since the backend endpoint doesn't exist yet
//         return [
//           {
//             id: '1',
//             name: 'Paris Office',
//             location: 'Paris, France',
//             contactEmail: 'paris@recruitmentplus.com',
//             contactPhone: '+33145678901',
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           },
//           {
//             id: '2',
//             name: 'Lyon Office',
//             location: 'Lyon, France',
//             contactEmail: 'lyon@recruitmentplus.com',
//             contactPhone: '+33478901234',
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           },
//           {
//             id: '3',
//             name: 'Marseille Office',
//             location: 'Marseille, France',
//             contactEmail: 'marseille@recruitmentplus.com',
//             contactPhone: '+33491234567',
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           }
//         ];
//       }
//     },
      
//     getById: async (id: string) => {
//       try {
//         const office = await fetcher<Office>(`/api/v1/offices/${id}`);
        
//         return {
//           ...office,
//           createdAt: office.createdAt instanceof Date ? office.createdAt : new Date(office.createdAt),
//           updatedAt: office.updatedAt instanceof Date ? office.updatedAt : new Date(office.updatedAt),
//         };
//       } catch (error) {
//         console.error('Failed to fetch office:', error);
//         // Return a mock office since the backend endpoint doesn't exist yet
//         return {
//           id,
//           name: `Office ${id}`,
//           location: ['Paris, France', 'Lyon, France', 'Marseille, France'][parseInt(id) % 3],
//           contactEmail: `office${id}@recruitmentplus.com`,
//           contactPhone: '+33123456789',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         };
//       }
//     },
//   },
// };