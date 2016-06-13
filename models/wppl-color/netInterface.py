import cPickle as pickle
import sys
import json
from stanza.research.instance import Instance

# colorH = argv[1]
# colorS = argv[2]
# colorL = argv[3]
# word = argv[4]

sys.path = ['/Users/rxdh/Repos/reference_games/models/coop-nets'] + sys.path

with open('./coop-nets/runs/lstm_fourier/quickpickle.p', 'rb') as infile:
    model = pickle.load(infile)

for line in sys.stdin:
    print(model.score([Instance((line.colorH, 100., 100.), 'greenish')]))
