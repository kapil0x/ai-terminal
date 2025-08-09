" AI Terminal Vim Integration
" Add this to your ~/.vimrc or ~/.config/nvim/init.vim

" Quick AI commands
nnoremap <leader>ar :! aiterm review %<CR>
nnoremap <leader>af :! aiterm fix % --backup<CR>
nnoremap <leader>at :! aiterm test %<CR>
nnoremap <leader>ap :! aiterm analyze<CR>
nnoremap <leader>ag :! aiterm gitreview<CR>

" Interactive prompts
nnoremap <leader>am :call AitermModify()<CR>
nnoremap <leader>aa :call AitermAsk()<CR>

" AI commands for visual selections
vnoremap <leader>ae :call AitermExplain()<CR>
vnoremap <leader>ar :call AitermRefactorSelection()<CR>

" Functions for interactive prompts
function! AitermModify()
    let prompt = input('Modification prompt: ')
    if prompt != ''
        execute '! aiterm modify % "' . prompt . '" --preview'
    endif
endfunction

function! AitermAsk()
    let question = input('Ask AI: ')
    if question != ''
        execute '! aiterm ask "' . question . '"'
    endif
endfunction

function! AitermExplain()
    " Write selected text to temp file and explain
    normal! gv"ay
    let temp_file = '/tmp/aiterm_selection.txt'
    call writefile(split(@a, '\n'), temp_file)
    execute '! aiterm ask "Explain this code:" && cat ' . temp_file
    call delete(temp_file)
endfunction

function! AitermRefactorSelection()
    " Get visual selection and ask for refactoring
    normal! gv"ay
    let temp_file = '/tmp/aiterm_selection.txt'
    call writefile(split(@a, '\n'), temp_file)
    execute '! aiterm ask "How can I refactor this code to be better?" && cat ' . temp_file
    call delete(temp_file)
endfunction

" Insert AI-generated code
command! -nargs=1 AitermGenerate :read ! aiterm ask "Generate code: <args>"

" Quick templates
command! AitermSecurityReview :! aiterm review % -t security
command! AitermPerformanceReview :! aiterm review % -t performance
command! AitermTeamReview :! aiterm review % -t team-standards

" Status line integration (optional)
function! AitermStatus()
    return system('aiterm status 2>/dev/null | grep "API Key" | cut -d: -f2')
endfunction

" Key mappings reference:
" <leader>ar - Review current file
" <leader>af - Auto-fix current file
" <leader>at - Generate tests for current file
" <leader>ap - Analyze project
" <leader>ag - Review git changes
" <leader>am - Modify file with prompt
" <leader>aa - Ask AI a question
" <leader>ae - Explain selected code (visual mode)
" <leader>ar - Refactor selected code (visual mode)