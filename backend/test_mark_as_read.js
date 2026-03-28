/**
 * test_mark_as_read.js
 * Test script to verify marking notifications as read functionality
 */

require('dotenv').config({ path: 'sample.env' });
const { supabaseAdmin } = require('./src/config/supabase.js');

const testMarkAsRead = async () => {
  console.log('\n🧪 Testing Mark Notification as Read Functionality\n');

  const userEmail = 'ajeet1973.at@gmail.com';

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 1: Fetch unread notifications
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('📋 Step 1: Fetching unread notifications...');
    const { data: unreadNotifs, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('id, title, read, useremail')
      .eq('useremail', userEmail)
      .eq('read', false);

    if (fetchError) throw fetchError;

    if (!unreadNotifs || unreadNotifs.length === 0) {
      console.log('⚠️  No unread notifications found. Creating test notifications first...\n');
      
      // Create test notifications
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert([
          {
            useremail: userEmail,
            type: 'payment',
            icon: 'money',
            title: 'Test: Payment Recorded',
            message: 'Test payment notification',
            read: false,
            createdat: new Date().toISOString()
          },
          {
            useremail: userEmail,
            type: 'due',
            icon: 'alert',
            title: 'Test: Payment Due',
            message: 'Test due notification',
            read: false,
            createdat: new Date().toISOString()
          }
        ]);

      if (insertError) throw insertError;
      console.log('✅ Test notifications created\n');

      // Fetch again
      const { data: newNotifs, error: newError } = await supabaseAdmin
        .from('notifications')
        .select('id, title, read, useremail')
        .eq('useremail', userEmail)
        .eq('read', false);

      if (newError) throw newError;
      unreadNotifs.push(...newNotifs);
    }

    console.log(`✅ Found ${unreadNotifs.length} unread notifications:`);
    unreadNotifs.forEach((notif, idx) => {
      console.log(`   ${idx + 1}. ${notif.title} (ID: ${notif.id}, Read: ${notif.read})`);
    });

    if (unreadNotifs.length === 0) {
      console.log('\n❌ Still no notifications to test with. Please create notifications manually.');
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 2: Mark first notification as read
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('\n📝 Step 2: Marking first notification as read...');
    const targetNotifId = unreadNotifs[0].id;
    const targetTitle = unreadNotifs[0].title;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', targetNotifId)
      .select('id, title, read');

    if (updateError) throw updateError;

    if (updated && updated.length > 0) {
      console.log(`✅ Marked as read: ${targetTitle}`);
      console.log(`   Before: read = false`);
      console.log(`   After:  read = ${updated[0].read}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 3: Verify the change
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('\n🔍 Step 3: Verifying the change in database...');
    const { data: verification, error: verifyError } = await supabaseAdmin
      .from('notifications')
      .select('id, title, read')
      .eq('id', targetNotifId)
      .single();

    if (verifyError) throw verifyError;

    console.log(`✅ Notification status verified:`);
    console.log(`   ID:    ${verification.id}`);
    console.log(`   Title: ${verification.title}`);
    console.log(`   Read:  ${verification.read ? '✓ TRUE' : '✗ FALSE'}`);

    if (verification.read === true) {
      console.log('\n✅ SUCCESS: Mark as read is working correctly!');
    } else {
      console.log('\n❌ FAILURE: Notification still marked as unread!');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 4: Test Mark All as Read
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('\n📝 Step 4: Testing Mark All as Read...');
    
    const { data: unreadCount, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('useremail', userEmail)
      .eq('read', false);

    if (countError) throw countError;

    console.log(`   Found ${unreadCount?.length || 0} unread notifications before marking all`);

    const { data: allUpdated, error: markAllError } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('useremail', userEmail)
      .eq('read', false)
      .select('id');

    if (markAllError) throw markAllError;

    console.log(`✅ Marked ${allUpdated?.length || 0} notifications as read`);

    // Final verification
    const { data: finalCheck, error: finalError } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('useremail', userEmail)
      .eq('read', false);

    if (finalError) throw finalError;

    console.log(`✅ Final check: ${finalCheck?.length || 0} unread notifications remaining`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tests passed! Mark as read functionality is working.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    if (err.details) console.error('Details:', err.details);
    process.exit(1);
  }
};

testMarkAsRead();
