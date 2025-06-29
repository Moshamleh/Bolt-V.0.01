# 🚗 BOLT AUTO - AI DEVELOPMENT INSTRUCTIONS

## 🎯 CRITICAL PROJECT CONTEXT

**BOLT AUTO** is an enterprise-level automotive platform combining:
- **AI Diagnostic System** (ChatGPT-level car diagnostics)
- **P2P Marketplace** (Amazon-style parts marketplace)  
- **Community Platform** (Facebook/Reddit-style car communities)
- **Live Mechanic Help** (Fiverr-style professional services)

---

## ⚠️ MANDATORY DEVELOPMENT RULES

### 1. **NO DUPLICATE FILES OR WORK**
- ✅ **ONLY EDIT EXISTING FILES** - Never create new files unless explicitly requested
- ✅ **CHECK EXISTING STRUCTURE** - Always examine current implementation before making changes
- ✅ **USE EXISTING COMPONENTS** - Leverage the 50+ React components already built
- ❌ **NEVER** recreate functionality that already exists

### 2. **SUPABASE IS OUR BACKEND** 
- ✅ **USE EXISTING TABLES** - We have 80+ migrations with comprehensive schema
- ✅ **LEVERAGE SUPABASE FUNCTIONS** - Use existing Edge Functions in `/supabase/functions/`
- ✅ **MAINTAIN RLS POLICIES** - Respect existing Row Level Security setup
- ✅ **USE EXISTING SUPABASE CLIENT** - Found in `/src/lib/supabase.ts`
- ❌ **NEVER** suggest alternative backends or duplicate database logic

### 3. **OPENAI INTEGRATION IS CONFIGURED**
- ✅ **KEYS ARE SET** - OpenAI API keys exist in `.env` and `.env.local`
- ✅ **USE EXISTING FUNCTIONS** - Diagnostic AI is in `/src/lib/supabase.ts` (`sendDiagnosticPrompt`)
- ✅ **LEVERAGE CURRENT IMPLEMENTATION** - Chat interface exists in `/src/components/ChatInterface.tsx`
- ❌ **NEVER** recreate OpenAI integration from scratch

### 4. **UNDERSTAND THE 4 CORE FEATURES**

#### **FEATURE 1: AI DIAGNOSTIC SYSTEM (75% Complete)**
- Location: `/src/pages/DiagnosticPage.tsx`
- Components: `ChatInterface`, `ChatHistory`, `RepairTipsPanel`
- Database: `diagnoses`, `vehicles`, `service_records` tables
- Status: Working AI chat, needs enhanced repair guides

#### **FEATURE 2: P2P MARKETPLACE (80% Complete)**  
- Location: `/src/pages/MarketplacePage.tsx`
- Components: `PartCard`, `OfferModal`, `PartChat`
- Database: `parts`, `offers`, `part_chats`, `seller_reviews` tables  
- Status: Full marketplace, needs auto-title generation & bulk upload

#### **FEATURE 3: COMMUNITY SYSTEM (70% Complete)**
- Location: `/src/pages/ClubListPage.tsx` and community routes
- Components: `CommunityLayout`, `ClubSidebar` 
- Database: `clubs`, `club_members`, `club_messages` tables
- Status: Working communities, needs feed algorithm & voting

#### **FEATURE 4: LIVE MECHANIC HELP (40% Complete)**
- Location: `/src/pages/MechanicSupportPage.tsx`
- Components: `MechanicChatPage`, `MechanicProfilePage`
- Database: `mechanics`, `mechanic_chats` tables
- Status: Basic mechanic discovery, needs call/video & booking system

---

## 🏗️ DEVELOPMENT WORKFLOW

### **BEFORE MAKING ANY CHANGES:**
1. **ANALYZE EXISTING CODE** - Check current implementation thoroughly
2. **IDENTIFY DEPENDENCIES** - Understand component relationships  
3. **REVIEW DATABASE SCHEMA** - Check existing tables and relationships
4. **UNDERSTAND USER FLOW** - Know how features connect together

### **WHEN IMPLEMENTING FEATURES:**
1. **BUILD ON EXISTING FOUNDATION** - Extend, don't replace
2. **MAINTAIN CONSISTENCY** - Follow established patterns and naming
3. **PRESERVE FUNCTIONALITY** - Don't break existing working features
4. **THINK ENTERPRISE-SCALE** - This platform serves thousands of users

### **CODE QUALITY STANDARDS:**
- ✅ **TypeScript strict mode** - Maintain type safety
- ✅ **React best practices** - Functional components, hooks, proper state management
- ✅ **Error handling** - Use existing ErrorBoundary and error handling patterns
- ✅ **Performance optimization** - Lazy loading, proper memo usage
- ✅ **Accessibility** - Maintain ARIA labels and keyboard navigation
- ✅ **Mobile responsiveness** - Platform is mobile-first

---

## 📁 PROJECT STRUCTURE UNDERSTANDING

```
/src
├── components/          # 50+ reusable React components
├── pages/              # Main application pages (30+ pages)  
├── lib/                # Core utilities and Supabase client
├── hooks/              # Custom React hooks
└── context/            # React context providers

/supabase
├── migrations/         # 80+ database migrations (DO NOT MODIFY)
└── functions/          # Edge Functions (8 functions available)
```

---

## 🎯 CURRENT PRIORITIES

### **HIGH PRIORITY:**
1. **Complete OpenAI integration** for auto-title generation
2. **Finish live help booking system** with scheduling
3. **Implement call/video functionality** using WebRTC
4. **Add bulk upload** for marketplace listings

### **MEDIUM PRIORITY:**
1. **Enhance community feed algorithm**
2. **Improve location-based search**
3. **Add push notifications**
4. **Optimize mobile performance**

---

## 🚨 CRITICAL REMINDERS

- **THIS IS NOT A PROTOTYPE** - This is a production-ready platform with real users
- **MAINTAIN BACKWARDS COMPATIBILITY** - Don't break existing functionality
- **RESPECT EXISTING ARCHITECTURE** - The foundation is solid, build on it
- **THINK SCALABILITY** - Every change should handle thousands of concurrent users
- **PRESERVE DATA INTEGRITY** - Existing database has critical user data

---

## 💡 WHEN IN DOUBT:

1. **ASK FOR CLARIFICATION** - Better to confirm than assume
2. **EXAMINE EXISTING PATTERNS** - Look at how similar features are implemented
3. **TEST THOROUGHLY** - Verify changes don't break existing functionality
4. **DOCUMENT CHANGES** - Explain what was modified and why

---

**REMEMBER: We're building the next-generation automotive platform. Every line of code matters. Work smart, work clean, work with the existing foundation.**