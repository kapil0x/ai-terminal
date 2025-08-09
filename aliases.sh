#!/bin/bash
# AI Terminal Aliases
# Add these to your ~/.bashrc, ~/.zshrc, or ~/.profile

# Core AI commands
alias arev="aiterm review"
alias amod="aiterm modify"
alias afix="aiterm fix"
alias atest="aiterm test"
alias aask="aiterm ask"
alias achat="aiterm chat"
alias aanalyze="aiterm analyze"
alias agit="aiterm gitreview"
alias astatus="aiterm status"
alias aupdate="aiterm update"

# Template shortcuts
alias ars="aiterm review -t security"
alias arp="aiterm review -t performance"
alias art="aiterm review -t team-standards"
alias arj="aiterm review -t junior-dev"

# Template management
alias atl="aiterm template list"
alias ats="aiterm template show"
alias atc="aiterm template create"
alias atd="aiterm template delete"

# Common patterns
alias afix="aiterm fix --backup"
alias amod="aiterm modify --preview"

echo "AI Terminal aliases loaded!"
echo "Usage examples:"
echo "  arev myfile.js           # Review file"
echo "  amod myfile.js 'prompt'  # Modify file"
echo "  afix myfile.js           # Fix file"
echo "  aask 'question'          # Ask AI"
echo "  achat                    # Start chat"
echo "  agit                     # Review git changes"