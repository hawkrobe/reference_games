import cPickle as pickle
import sys
import json
import os
from stanza.research.instance import Instance

# Make sure the relevant libraries are accessible before loading RNN
sys.path = ['/Users/rxdh/Repos/reference_games/models/coop-nets'] + sys.path

# Load RNN
with open('./coop-nets/runs/lstm_fourier/quickpickle.p', 'rb') as infile:
    model = pickle.load(infile)

# Parse messages sent from header.js
for line in sys.stdin:
    color = json.loads(line)['color']
    utterance = json.loads(line)['utterance']
    
    # Suppress print statements from Will's code
    oldStdOut = sys.stdout
    f = open(os.devnull, 'w')
    sys.stdout = f
    
    # Get score of this color-utterance combo
    score = model.score([Instance(color, utterance)])
    sys.stdout = oldStdOut
    
    # Return score to javascript
    print(score)
