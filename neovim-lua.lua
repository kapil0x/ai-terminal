-- AI Terminal Neovim Integration (Lua)
-- Add this to your ~/.config/nvim/init.lua or a separate plugin file

local M = {}

-- Key mappings
local function set_keymap(mode, lhs, rhs, opts)
    opts = opts or {}
    opts.silent = opts.silent ~= false
    vim.keymap.set(mode, lhs, rhs, opts)
end

-- Quick AI commands
set_keymap('n', '<leader>ar', ':! aiterm review %<CR>', { desc = 'AI Review current file' })
set_keymap('n', '<leader>af', ':! aiterm fix % --backup<CR>', { desc = 'AI Fix current file' })
set_keymap('n', '<leader>at', ':! aiterm test %<CR>', { desc = 'AI Generate tests' })
set_keymap('n', '<leader>ap', ':! aiterm analyze<CR>', { desc = 'AI Analyze project' })
set_keymap('n', '<leader>ag', ':! aiterm gitreview<CR>', { desc = 'AI Review git changes' })

-- Interactive prompts
set_keymap('n', '<leader>am', function()
    local prompt = vim.fn.input('Modification prompt: ')
    if prompt ~= '' then
        vim.cmd('! aiterm modify % "' .. prompt .. '" --preview')
    end
end, { desc = 'AI Modify with prompt' })

set_keymap('n', '<leader>aa', function()
    local question = vim.fn.input('Ask AI: ')
    if question ~= '' then
        vim.cmd('! aiterm ask "' .. question .. '"')
    end
end, { desc = 'Ask AI question' })

-- Visual mode selections
set_keymap('v', '<leader>ae', function()
    -- Get visual selection
    local start_pos = vim.fn.getpos("'<")
    local end_pos = vim.fn.getpos("'>")
    local lines = vim.fn.getline(start_pos[2], end_pos[2])
    
    -- Write to temp file
    local temp_file = '/tmp/aiterm_selection.txt'
    vim.fn.writefile(lines, temp_file)
    
    vim.cmd('! aiterm ask "Explain this code:" && cat ' .. temp_file)
    vim.fn.delete(temp_file)
end, { desc = 'AI Explain selection' })

set_keymap('v', '<leader>ar', function()
    -- Get visual selection and ask for refactoring
    local start_pos = vim.fn.getpos("'<")
    local end_pos = vim.fn.getpos("'>")
    local lines = vim.fn.getline(start_pos[2], end_pos[2])
    
    local temp_file = '/tmp/aiterm_selection.txt'
    vim.fn.writefile(lines, temp_file)
    
    vim.cmd('! aiterm ask "How can I refactor this code?" && cat ' .. temp_file)
    vim.fn.delete(temp_file)
end, { desc = 'AI Refactor selection' })

-- Commands
vim.api.nvim_create_user_command('AitermGenerate', function(opts)
    vim.cmd('read ! aiterm ask "Generate code: ' .. opts.args .. '"')
end, { nargs = 1, desc = 'Generate code with AI' })

vim.api.nvim_create_user_command('AitermSecurityReview', function()
    vim.cmd('! aiterm review % -t security')
end, { desc = 'Security-focused review' })

vim.api.nvim_create_user_command('AitermPerformanceReview', function()
    vim.cmd('! aiterm review % -t performance')
end, { desc = 'Performance-focused review' })

vim.api.nvim_create_user_command('AitermTeamReview', function()
    vim.cmd('! aiterm review % -t team-standards')
end, { desc = 'Team standards review' })

-- Floating window for AI responses (advanced)
local function create_floating_window()
    local buf = vim.api.nvim_create_buf(false, true)
    local width = math.floor(vim.o.columns * 0.8)
    local height = math.floor(vim.o.lines * 0.8)
    local row = math.floor((vim.o.lines - height) / 2)
    local col = math.floor((vim.o.columns - width) / 2)
    
    local win = vim.api.nvim_open_win(buf, true, {
        relative = 'editor',
        width = width,
        height = height,
        row = row,
        col = col,
        style = 'minimal',
        border = 'rounded',
        title = ' AI Terminal Response ',
        title_pos = 'center'
    })
    
    return buf, win
end

-- AI chat in floating window
set_keymap('n', '<leader>ac', function()
    local buf, win = create_floating_window()
    vim.api.nvim_buf_set_lines(buf, 0, -1, false, {
        'AI Terminal Chat Mode',
        '===================',
        '',
        'Close this window and use: aiterm chat',
        'For full interactive experience in terminal',
        '',
        'Key mappings:',
        '<leader>ar - Review file',
        '<leader>af - Fix file', 
        '<leader>at - Generate tests',
        '<leader>am - Modify with prompt',
        '<leader>aa - Ask question',
    })
    
    -- Close on escape
    vim.keymap.set('n', '<Esc>', function()
        vim.api.nvim_win_close(win, true)
    end, { buffer = buf })
end, { desc = 'Open AI chat info' })

return M