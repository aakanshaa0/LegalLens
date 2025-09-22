require('dotenv').config();

console.log('🔍 Environment Configuration Check\n');

// Check required environment variables
const requiredVars = [
  'GEMINI_API_KEY',
  'CLERK_PUBLISHABLE_KEY', 
  'CLERK_SECRET_KEY'
];

const optionalVars = [
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL'
];

let allGood = true;

console.log('Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allGood = false;
  }
});

console.log('\nOptional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: using default`);
  }
});

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 All required environment variables are set!');
  console.log('You can now run: npm run dev');
} else {
  console.log('❌ Some required environment variables are missing.');
  console.log('Please check your .env file and add the missing variables.');
}

console.log('\nNext steps:');
console.log('1. Run: npm run test-gemini (to test API connection)');
console.log('2. Run: npm run dev (to start the server)');