// Simple test to verify Zustand auth store functionality
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Auth Migration...\n');

// Check if key files exist
const filesToCheck = [
  'src/store/useAuthStore.ts',
  'src/components/auth/AuthInitializer.tsx',
  'src/app/layout.tsx'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Check if AuthContext is no longer being imported/used in layout
const layoutPath = path.join(__dirname, 'src/app/layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

if (layoutContent.includes('AuthProvider')) {
  console.log('❌ layout.tsx still contains AuthProvider');
  allFilesExist = false;
} else {
  console.log('✅ AuthProvider removed from layout.tsx');
}

if (layoutContent.includes('AuthInitializer')) {
  console.log('✅ AuthInitializer added to layout.tsx');
} else {
  console.log('❌ AuthInitializer missing from layout.tsx');
  allFilesExist = false;
}

// Check if useAuthStore is properly imported in key components
const componentToCheck = 'src/app/login/page.tsx';
const componentPath = path.join(__dirname, componentToCheck);
const componentContent = fs.readFileSync(componentPath, 'utf8');

if (componentContent.includes('useAuthStore')) {
  console.log('✅ useAuthStore imported in login page');
} else {
  console.log('❌ useAuthStore not found in login page');
  allFilesExist = false;
}

if (componentContent.includes('useAuth') && !componentContent.includes('useAuthStore')) {
  console.log('❌ Old useAuth still present in login page');
  allFilesExist = false;
} else {
  console.log('✅ Old useAuth removed from login page');
}

console.log('\n' + (allFilesExist ? '🎉 Migration appears successful!' : '⚠️ Migration has issues that need to be addressed'));