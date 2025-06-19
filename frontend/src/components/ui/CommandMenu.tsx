// // src/components/ui/CommandMenu.tsx
// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useTheme } from '@/app/context/ThemeContext';
// import { useDataStore } from '@/store/useDataStore';
// import Input from '@/components/ui/Input';
// import { Candidate, Company } from '@/types';
// import {
//   FiSearch, FiMail, FiMessageSquare, FiBriefcase, FiEdit,
//   FiUsers, FiFileText, FiCpu, FiHelpCircle, FiX, FiLoader, FiAlertCircle,
// } from 'react-icons/fi';
// import Button from './Button';

// // Define the structure for a command
// export interface Command {
//   id: string;
//   label: string;
//   description: string;
//   icon: React.ReactNode;
//   action: () => void;
//   requiresEntity?: 'candidate' | 'company' | 'either' | null;
// }

// interface CommandMenuProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSelectCandidate: (candidate: Candidate) => void;
//   onSelectCompany: (company: Company) => void;
//   onInitiateEntitySelection: (commandRequires: 'candidate' | 'company' | 'either' | null, commandId: string) => void;
//   selectedEntity?: Candidate | Company | null;
// }

// // Command IDs
// export const CMD_SEARCH_CANDIDATE = 'search_candidate';
// export const CMD_SEARCH_COMPANY = 'search_company';
// export const CMD_GENERATE_EMAIL = 'generate_email';
// export const CMD_GENERATE_SUGGESTIONS = 'generate_suggestions';
// export const CMD_GENERATE_INTERVIEW_QUESTIONS = 'generate_interview_questions';
// export const CMD_GENERATE_JOB_DESCRIPTION = 'generate_job_description';
// export const CMD_GENERATE_CANDIDATE_FEEDBACK = 'generate_candidate_feedback';
// export const CMD_ANALYZE_CV = 'analyze_cv';
// export const CMD_OPEN_CHAT = 'open_chat';

// type CommandStep = 'initial' | 'search_candidate' | 'search_company';

// const CommandMenu: React.FC<CommandMenuProps> = ({
//   isOpen,
//   onClose,
//   onSelectCandidate,
//   onSelectCompany,
//   onInitiateEntitySelection,
//   selectedEntity = null,
// }) => {
//   const { colors, theme } = useTheme();
//   const menuRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);

//   // Use the Zustand store
//   const {
//     candidates,
//     companies,
//     isLoadingCandidates,
//     isLoadingCompanies,
//     candidatesError,
//     companiesError,
//     fetchCandidates,
//     fetchCompanies
//   } = useDataStore();

//   const [currentStep, setCurrentStep] = useState<CommandStep>('initial');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filteredEntities, setFilteredEntities] = useState<(Candidate | Company)[]>([]);
//   const [currentCommands, setCurrentCommands] = useState<Command[]>([]);
//   const [selectedIndex, setSelectedIndex] = useState(0);

//   console.log("Current step in CommandMenu:", currentStep);
//   console.log("Candidates length:", candidates.length);
//   console.log("Is loading candidates:", isLoadingCandidates);

//   // Fetch data immediately when the component mounts, not just when steps change
//   useEffect(() => {
//     if (isOpen) {
//       fetchCandidates();
//       fetchCompanies();
//     }
//   }, [isOpen, fetchCandidates, fetchCompanies]);

//   const getAvailableCommands = useCallback((): Command[] => {
//     // --- Action Definitions ---
//     const actionSearchCandidate = () => {
//       console.log("Search Candidate action triggered");
//       setCurrentStep('search_candidate');
//       // Focus the search input after a short delay to ensure DOM is updated
//       setTimeout(() => {
//         if (inputRef.current) inputRef.current.focus();
//       }, 100);
//     };
    
//     const actionSearchCompany = () => {
//       console.log("Search Company action triggered"); 
//       setCurrentStep('search_company');
//       setTimeout(() => {
//         if (inputRef.current) inputRef.current.focus();
//       }, 100);
//     };
    
//     const actionInitiateForEntity = (commandId: string, entityType: 'candidate' | 'company' | 'either' | null) => {
//         onInitiateEntitySelection(entityType, commandId);
//     };
    
//     const actionOpenChat = () => {
//         onInitiateEntitySelection(selectedEntity ? ('firstName' in selectedEntity ? 'candidate' : 'company') : null, CMD_OPEN_CHAT);
//         onClose(); 
//     };

//     const baseCommands: Command[] = [
//       { id: CMD_SEARCH_CANDIDATE, label: 'Search Candidate', description: 'Find and set context to a candidate', icon: <FiUsers />, action: actionSearchCandidate, requiresEntity: null },
//       { id: CMD_SEARCH_COMPANY, label: 'Search Company', description: 'Find and set context to a company', icon: <FiBriefcase />, action: actionSearchCompany, requiresEntity: null },
//     ];

//     if (selectedEntity) {
//       const entityType = 'firstName' in selectedEntity ? 'candidate' : 'company';
//       const entityName = 'firstName' in selectedEntity ? `${selectedEntity.firstName} ${selectedEntity.lastName}` : selectedEntity.name;

//       const contextualCommands: Command[] = [
//         { id: CMD_GENERATE_EMAIL, label: `Email for ${entityName}`, description: `Draft an email for this ${entityType}`, icon: <FiMail />, action: () => actionInitiateForEntity(CMD_GENERATE_EMAIL, entityType), requiresEntity: entityType },
//         { id: CMD_GENERATE_SUGGESTIONS, label: `Suggestions for ${entityName}`, description: `Get AI suggestions for this ${entityType}`, icon: <FiCpu />, action: () => actionInitiateForEntity(CMD_GENERATE_SUGGESTIONS, entityType), requiresEntity: entityType },
//         { id: CMD_OPEN_CHAT, label: `Chat about ${entityName}`, description: `Discuss this ${entityType}`, icon: <FiMessageSquare />, action: actionOpenChat, requiresEntity: entityType },
//       ];
//       if (entityType === 'candidate') {
//         contextualCommands.push(
//           { id: CMD_GENERATE_CANDIDATE_FEEDBACK, label: `Feedback for ${entityName}`, description: 'Generate feedback', icon: <FiEdit />, action: () => actionInitiateForEntity(CMD_GENERATE_CANDIDATE_FEEDBACK, 'candidate'), requiresEntity: 'candidate' },
//           { id: CMD_GENERATE_INTERVIEW_QUESTIONS, label: `Interview Qs for ${entityName}`, description: `For ${'firstName' in selectedEntity ? selectedEntity.position || 'their role' : 'their role'}`, icon: <FiHelpCircle />, action: () => actionInitiateForEntity(CMD_GENERATE_INTERVIEW_QUESTIONS, 'candidate'), requiresEntity: 'candidate' }
//         );
//       } else { // Company
//         contextualCommands.push(
//           { id: CMD_GENERATE_JOB_DESCRIPTION, label: `Job Desc for ${entityName}`, description: 'Draft a job description', icon: <FiFileText />, action: () => actionInitiateForEntity(CMD_GENERATE_JOB_DESCRIPTION, 'company'), requiresEntity: 'company' },
//           { id: CMD_GENERATE_INTERVIEW_QUESTIONS, label: `Interview Qs (Company)`, description: `For roles at ${entityName}`, icon: <FiHelpCircle />, action: () => actionInitiateForEntity(CMD_GENERATE_INTERVIEW_QUESTIONS, 'company'), requiresEntity: 'company' }
//         );
//       }
//       return [
//         ...contextualCommands,
//         ...baseCommands.map(cmd => ({...cmd, description: `Switch context / ${cmd.description}`}))
//       ];
//     }

//     return [
//       ...baseCommands,
//       { id: CMD_ANALYZE_CV, label: 'Analyze CV', description: 'Extract info from pasted CV text', icon: <FiFileText />, action: () => actionInitiateForEntity(CMD_ANALYZE_CV, null), requiresEntity: null },
//       { id: CMD_GENERATE_JOB_DESCRIPTION, label: 'Generic Job Description', description: 'Draft a generic job description', icon: <FiFileText />, action: () => actionInitiateForEntity(CMD_GENERATE_JOB_DESCRIPTION, null), requiresEntity: null },
//       { id: CMD_GENERATE_INTERVIEW_QUESTIONS, label: 'Generic Interview Questions', description: 'Draft generic interview questions', icon: <FiHelpCircle />, action: () => actionInitiateForEntity(CMD_GENERATE_INTERVIEW_QUESTIONS, null), requiresEntity: null },
//     ];
//   }, [selectedEntity, onInitiateEntitySelection, onClose]);

//   // Reset to initial step when the modal first opens
//   useEffect(() => {
//     if (isOpen) {
//       setCurrentStep('initial');
//       setSearchTerm('');
//       setCurrentCommands(getAvailableCommands());
//     }
//   }, [isOpen, getAvailableCommands]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         onClose();
//       }
//     };
//     if (isOpen) document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [isOpen, onClose]);

//   // Handle step changes to update the UI accordingly
//   useEffect(() => {
//     if (currentStep === 'search_candidate' || currentStep === 'search_company') {
//       // Focus the search input when switching to search mode
//       setTimeout(() => {
//         if (inputRef.current) inputRef.current.focus();
//       }, 100);
//     }
//   }, [currentStep]);

//   // Filter entities based on search term and current step
//   useEffect(() => {
//     let newFiltered: (Candidate | Company)[] = [];
    
//     if (currentStep === 'search_candidate') {
//       if (!isLoadingCandidates && candidates.length > 0) {
//         newFiltered = searchTerm
//           ? candidates.filter(c => 
//               `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
//               (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) || 
//               (c.position && c.position.toLowerCase().includes(searchTerm.toLowerCase())))
//           : candidates;
//       }
//     } else if (currentStep === 'search_company') {
//       if (!isLoadingCompanies && companies.length > 0) {
//         newFiltered = searchTerm
//           ? companies.filter(c => 
//               c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
//               (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase())))
//           : companies;
//       }
//     }
    
//     console.log("Filtered entities:", newFiltered.length);
//     setFilteredEntities(newFiltered);
//     setSelectedIndex(0);
//   }, [currentStep, searchTerm, candidates, companies, isLoadingCandidates, isLoadingCompanies]);

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     let itemsForNav: (Command | Candidate | Company)[] = currentCommands;
//     if (currentStep === 'search_candidate' || currentStep === 'search_company') {
//       itemsForNav = filteredEntities;
//     }
    
//     const currentListLength = itemsForNav.length || 0;
//     if (currentListLength === 0 && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
//         e.preventDefault(); return;
//     }

//     if (e.key === 'ArrowDown') {
//       e.preventDefault(); setSelectedIndex(prev => (prev + 1) % currentListLength);
//     } else if (e.key === 'ArrowUp') {
//       e.preventDefault(); setSelectedIndex(prev => (prev - 1 + currentListLength) % currentListLength);
//     } else if (e.key === 'Enter') {
//       e.preventDefault(); handleItemSelect(selectedIndex);
//     } else if (e.key === 'Escape') {
//       e.preventDefault();
//       if (currentStep === 'initial') onClose();
//       else setCurrentStep('initial');
//     }
//   };

//   const handleItemSelect = (indexToSelect?: number) => {
//     const idx = typeof indexToSelect === 'number' ? indexToSelect : selectedIndex;

//     if (currentStep === 'initial') {
//       if (currentCommands[idx]) {
//         const command = currentCommands[idx];
//         command.action();
//       }
//     } else if (currentStep === 'search_candidate') {
//       if (filteredEntities[idx]) {
//         onSelectCandidate(filteredEntities[idx] as Candidate);
//         onClose(); // Close the modal after selection
//       }
//     } else if (currentStep === 'search_company') {
//       if (filteredEntities[idx]) {
//         onSelectCompany(filteredEntities[idx] as Company);
//         onClose(); // Close the modal after selection
//       }
//     }
//   };  
  
//   const handleClickSelect = (index: number) => {
//     setSelectedIndex(index);
//     handleItemSelect(index);
//   };

//   const renderTitle = () => {
//     switch (currentStep) {
//       case 'search_candidate': return 'Search Candidates';
//       case 'search_company': return 'Search Companies';
//       default: return 'AI Assistant Commands';
//     }
//   };

//   const renderCommandList = () => (
//     currentCommands.map((command, index) => (
//       <motion.div
//         key={command.id + '-' + index}
//         className={`px-4 py-3 flex items-center cursor-pointer rounded-lg mx-2 my-1 transition-colors duration-150`}
//         style={{
//           backgroundColor: selectedIndex === index ? (theme === 'light' ? `${colors.primary}1A` : `${colors.primary}33`) : 'transparent',
//           color: selectedIndex === index ? colors.primary : colors.text,
//         }}
//         whileHover={{ backgroundColor: theme === 'light' ? `${colors.primary}10` : `${colors.primary}26` }}
//         onClick={() => handleClickSelect(index)}
//         role="menuitem"
//         aria-selected={selectedIndex === index}
//       >
//         <div
//           className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
//           style={{
//             backgroundColor: selectedIndex === index ? `${colors.primary}2A` : `${colors.primary}15`,
//             color: colors.primary,
//           }}
//         >
//           {command.icon}
//         </div>
//         <div>
//           <div className="font-medium text-sm">{command.label}</div>
//           <div className="text-xs opacity-70">{command.description}</div>
//         </div>
//       </motion.div>
//     ))
//   );

//   const renderEntityList = (items: (Candidate | Company)[], entityType: 'candidate' | 'company', isLoading: boolean, error: string | null) => {
//     if (isLoading) {
//       return (
//         <div className="px-4 py-8 text-center flex flex-col items-center justify-center" style={{ color: `${colors.text}99` }}>
//           <FiLoader className="w-8 h-8 mb-3 animate-spin" style={{ color: colors.primary }} />
//           <p className="font-medium">Loading {entityType === 'candidate' ? 'candidates' : 'companies'}...</p>
//         </div>
//       );
//     }
    
//     if (error) {
//       return (
//         <div className="px-4 py-8 text-center flex flex-col items-center justify-center" style={{ color: colors.text }}>
//            <FiAlertCircle className="w-10 h-10 mb-3 text-red-500" />
//           <p className="font-medium text-red-600 dark:text-red-400">Error loading data</p>
//           <p className="text-sm opacity-70 mt-1">{error}</p>
//         </div>
//       );
//     }
    
//     if (items.length === 0 && searchTerm) {
//         return (
//              <div className="px-4 py-8 text-center" style={{ color: `${colors.text}99` }}>
//                 <motion.div initial={{ opacity: 0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1}}>
//                     <FiSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
//                     <p className="font-medium">No {entityType} found for &quot;{searchTerm}&quot;</p>
//                     <p className="text-sm opacity-70">Try a different search.</p>
//                 </motion.div>
//              </div>
//         );
//     }
    
//     if (items.length === 0 && !searchTerm) {
//         return (
//              <div className="px-4 py-8 text-center" style={{ color: `${colors.text}99` }}>
//                 <motion.div initial={{ opacity: 0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1}}>
//                     {entityType === 'candidate' ? <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-30" /> : <FiBriefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />}
//                     <p className="font-medium">No {entityType} available</p>
//                     <p className="text-sm opacity-70">There are no {entityType} to display.</p>
//                 </motion.div>
//              </div>
//         );
//     }
    
//     return items.map((item, index) => {
//       const isCandidate = entityType === 'candidate';
//       const candidate = isCandidate ? (item as Candidate) : null;
//       const company = !isCandidate ? (item as Company) : null;
      
//       return (
//         <motion.div
//           key={item.id}
//           className={`px-4 py-3 flex items-center cursor-pointer rounded-lg mx-2 my-1 transition-colors duration-150`}
//           style={{
//              backgroundColor: selectedIndex === index ? (theme === 'light' ? `${colors.primary}1A` : `${colors.primary}33`) : 'transparent',
//             color: selectedIndex === index ? colors.primary : colors.text,
//           }}
//           whileHover={{ backgroundColor: theme === 'light' ? `${colors.primary}10` : `${colors.primary}26` }}
//           onClick={() => handleClickSelect(index)}
//           role="option"
//           aria-selected={selectedIndex === index}
//         >
//           <div
//             className={`w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 text-white font-medium ${entityType === 'candidate' ? 'rounded-full' : 'rounded-md'}`}
//             style={{ backgroundColor: entityType === 'candidate' ? colors.primary : colors.secondary }}
//           >
//             {isCandidate
//               ? `${candidate?.firstName?.[0]}${candidate?.lastName?.[0]}`
//               : company?.name?.[0]}
//           </div>
//           <div className="flex-1 min-w-0">
//             <div className="font-medium text-sm">
//               {isCandidate
//                 ? `${candidate?.firstName} ${candidate?.lastName}`
//                 : company?.name}
//             </div>
//             <div className="text-xs opacity-70 truncate">
//               {isCandidate
//                 ? `${candidate?.position || 'No position'} · ${candidate?.email || 'No email'}`
//                 : `${company?.industry || 'No industry'} · ${company?.contactPerson || 'No contact'}`}
//             </div>
//           </div>
//         </motion.div>
//       );
//     });
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//       <div
//         ref={menuRef}
//         className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
//         style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
//         role="dialog" aria-modal="true" aria-labelledby="command-menu-title"
//       >
//         <header className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: colors.border }}>
//           <h3 id="command-menu-title" className="text-lg font-semibold" style={{ color: colors.text }}>
//             {renderTitle()}
//           </h3>
//           <button
//             className="p-1.5 rounded-full transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
//             onClick={onClose} aria-label="Close command menu"
//           >
//             <FiX className="w-5 h-5" />
//           </button>
//         </header>

//         {(currentStep === 'search_candidate' || currentStep === 'search_company') && (
//           <div className="p-4 border-b" style={{ borderColor: colors.border }}>
//             <Input
//               ref={inputRef}
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               onKeyDown={handleKeyDown}
//               placeholder={`Search ${currentStep === 'search_candidate' ? 'candidates' : 'companies'}...`}
//               fullWidth
//               leftIcon={<FiSearch className="w-4 h-4 text-gray-400" />}
//               className="text-base"
//             />
//           </div>
//         )}

//         <div className="py-2 flex-1 overflow-y-auto" role="menu">
//           {currentStep === 'initial' 
//             ? renderCommandList()
//             : currentStep === 'search_candidate'
//               ? renderEntityList(filteredEntities, 'candidate', isLoadingCandidates, candidatesError)
//               : renderEntityList(filteredEntities, 'company', isLoadingCompanies, companiesError)}
//         </div>

//         <footer className="p-4 border-t flex justify-between items-center flex-shrink-0" style={{ borderColor: colors.border }}>
//           <Button
//             variant="outline"
//             onClick={() => {
//               if (currentStep === 'initial') onClose();
//               else setCurrentStep('initial');
//             }}  
//             size="sm"
//           >
//             {currentStep === 'initial' ? 'Cancel' : 'Back'}
//           </Button>
//           <div className="text-xs opacity-60" style={{ color: colors.text }}>
//             <span>&uarr;&darr; Navigate, Enter to select, Esc to {currentStep === 'initial' ? 'close' : 'back'}</span>
//           </div>
//         </footer>
//       </div>
//     </div>
//   );
// };

// export { CommandMenu };