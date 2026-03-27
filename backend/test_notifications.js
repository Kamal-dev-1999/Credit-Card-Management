const { supabaseAdmin } = require('./src/config/supabase.js');
require('dotenv').config();

const testNotifications = async () => {
  try {
    console.log('🚀 Inserting test notifications...\n');

    const notifications = [
      {
        useremail: 'ajeet1973.at@gmail.com',
        type: 'payment',
        icon: 'success',
        title: '✅ Payment Recorded',
        message: 'Successfully recorded ₹5,000 payment for SBI PULSE Card',
        read: false,
        actionurl: '/dashboard'
      },
      {
        useremail: 'ajeet1973.at@gmail.com',
        type: 'due',
        icon: 'alert',
        title: '⏰ Payment Due Soon',
        message: 'HDFC Bank Visa - ₹15,250 due in 2 days!',
        read: false,
        actionurl: '/dashboard'
      },
      {
        useremail: 'ajeet1973.at@gmail.com',
        type: 'ai_insight',
        icon: 'sparkles',
        title: '✨ AI Insights Generated',
        message: 'New daily insights ready: "Your wealth grows from what you keep, not just what you make."',
        read: false,
        actionurl: '/ai-insights'
      },
      {
        useremail: 'ajeet1973.at@gmail.com',
        type: 'statement',
        icon: 'money',
        title: '📋 Statement Fetched',
        message: 'ICICI Bank Amazon Card - ₹22,500 statement updated',
        read: false,
        actionurl: '/dashboard'
      },
      {
        useremail: 'ajeet1973.at@gmail.com',
        type: 'due',
        icon: 'alert',
        title: '⚠️ High Utilization Alert',
        message: 'Your credit utilization is at 85%. Consider paying down your balance.',
        read: false,
        actionurl: '/credit-health'
      }
    ];

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log(`✅ Successfully inserted ${data.length} test notifications!\n`);
    console.log('📊 Notifications added:');
    data.forEach((notif, idx) => {
      console.log(`${idx + 1}. [${notif.type.toUpperCase()}] ${notif.title}`);
      console.log(`   Message: ${notif.message}\n`);
    });

    console.log('🎯 Now go to the app and click the notification bell to see them!\n');
    console.log('💡 Tips:');
    console.log('   - Refresh the page to see new notifications');
    console.log('   - The bell icon will show a badge with the count');
    console.log('   - Click "Mark All as Read" to test that feature');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

testNotifications();
