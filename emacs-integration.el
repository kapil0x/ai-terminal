;; AI Terminal Emacs Integration
;; Add this to your ~/.emacs or ~/.emacs.d/init.el

(defun aiterm-review-current-file ()
  "Review current file with AI."
  (interactive)
  (shell-command (concat "aiterm review " buffer-file-name)))

(defun aiterm-fix-current-file ()
  "Auto-fix current file with AI."
  (interactive)
  (shell-command (concat "aiterm fix " buffer-file-name " --backup")))

(defun aiterm-test-current-file ()
  "Generate tests for current file."
  (interactive)
  (shell-command (concat "aiterm test " buffer-file-name)))

(defun aiterm-analyze-project ()
  "Analyze current project."
  (interactive)
  (shell-command "aiterm analyze"))

(defun aiterm-modify-file ()
  "Modify current file with AI prompt."
  (interactive)
  (let ((prompt (read-string "Modification prompt: ")))
    (shell-command (concat "aiterm modify " buffer-file-name " \"" prompt "\" --preview"))))

(defun aiterm-ask ()
  "Ask AI a question."
  (interactive)
  (let ((question (read-string "Ask AI: ")))
    (shell-command (concat "aiterm ask \"" question "\""))))

(defun aiterm-explain-region ()
  "Explain selected region."
  (interactive)
  (if (use-region-p)
      (let ((text (buffer-substring-no-properties (region-beginning) (region-end))))
        (with-temp-file "/tmp/aiterm_selection.txt"
          (insert text))
        (shell-command "aiterm ask 'Explain this code:' && cat /tmp/aiterm_selection.txt"))
    (message "No region selected")))

;; Key bindings (using C-c a prefix)
(global-set-key (kbd "C-c a r") 'aiterm-review-current-file)
(global-set-key (kbd "C-c a f") 'aiterm-fix-current-file)
(global-set-key (kbd "C-c a t") 'aiterm-test-current-file)
(global-set-key (kbd "C-c a p") 'aiterm-analyze-project)
(global-set-key (kbd "C-c a m") 'aiterm-modify-file)
(global-set-key (kbd "C-c a a") 'aiterm-ask)
(global-set-key (kbd "C-c a e") 'aiterm-explain-region)

;; Menu integration
(define-key-after global-map [menu-bar aiterm]
  (cons "AI Terminal" (make-sparse-keymap "AI Terminal")) 'tools)

(define-key global-map [menu-bar aiterm review]
  '("Review File" . aiterm-review-current-file))
(define-key global-map [menu-bar aiterm fix]
  '("Fix File" . aiterm-fix-current-file))
(define-key global-map [menu-bar aiterm test]
  '("Generate Tests" . aiterm-test-current-file))
(define-key global-map [menu-bar aiterm modify]
  '("Modify File" . aiterm-modify-file))
(define-key global-map [menu-bar aiterm ask]
  '("Ask Question" . aiterm-ask))

(message "AI Terminal integration loaded! Use C-c a <key> for AI commands")