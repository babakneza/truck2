import fs from 'fs';
import path from 'path';

const files = [
  'read_file.mjs', 'read_file.js', 'read_receipt.mjs', 'read_msg_bubble.mjs',
  'read_context.mjs', 'read_context_section.mjs', 'read_msg_list.mjs',
  'read_normalize.mjs', 'read_socket.mjs', 'read_chat_window.mjs',
  'read_msg_list_comp.mjs', 'read_typing.mjs', 'read_msg_input.mjs',
  'read_set_typing.mjs', 'check_export.mjs', 'check_export2.mjs',
  'fix_chatapi_export.mjs', 'fix_context.mjs', 'fix_duplicates.mjs',
  'add_read_status.mjs', 'update_fetch_messages.mjs', 'fix_mark_as_read.mjs',
  'export_context.mjs', 'reorder_functions.mjs', 'verify_order.mjs',
  'read_value.mjs', 'read_mark_as_read.mjs', 'read_full_context.mjs',
  'ChatContext_backup.jsx', 'full_context.txt'
];

files.forEach(file => {
  const filePath = path.join('c:/projects/truck2', file);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted ${file}`);
    }
  } catch (err) {
    // Ignore errors
  }
});

console.log('Cleanup done');
