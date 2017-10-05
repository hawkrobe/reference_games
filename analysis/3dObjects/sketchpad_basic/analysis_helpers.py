import os
import json

exp_path = '3dObjects/sketchpad_basic'
exp_dir = os.path.abspath(os.path.join(os.getcwd(),'../../..','experiments',exp_path))

def get_summary_stats(D, all_games):
    all_games = np.unique(D['gameID'])
    further_strokes = []
    closer_strokes = []
    further_svgLength = []
    closer_svgLength = []
    further_svgStd = []
    closer_svgStd = []
    further_svgLengthPS = []
    closer_svgLengthPS = []
    further_drawDuration = []
    closer_drawDuration = []
    further_accuracy = []
    closer_accuracy = []
    for game in all_games:    
        further_strokes.append(D[(D['gameID']== game) & (D['condition'] == 'further')]['numStrokes'].mean())
        closer_strokes.append(D[(D['gameID']== game) & (D['condition'] == 'closer')]['numStrokes'].mean())
        further_svgLength.append(D[(D['gameID']== game) & (D['condition'] == 'further')]['svgStringLength'].mean())
        closer_svgLength.append(D[(D['gameID']== game) & (D['condition'] == 'closer')]['svgStringLength'].mean())
        further_svgStd.append(D[(D['gameID']== game) & (D['condition'] == 'further')]['svgStringStd'].mean())
        closer_svgStd.append(D[(D['gameID']== game) & (D['condition'] == 'closer')]['svgStringStd'].mean())    
        further_svgLengthPS.append(D[(D['gameID']== game) & (D['condition'] == 'further')]['svgStringLengthPerStroke'].mean())
        closer_svgLengthPS.append(D[(D['gameID']== game) & (D['condition'] == 'closer')]['svgStringLengthPerStroke'].mean())
        further_drawDuration.append(D[(D['gameID']== game) & (D['condition'] == 'further')]['drawDuration'].mean())
        closer_drawDuration.append(D[(D['gameID']== game) & (D['condition'] == 'closer')]['drawDuration'].mean())
        further_accuracy.append(D[(D['gameID']== game) & (D['condition'] == 'further')]['outcome'].mean())
        closer_accuracy.append(D[(D['gameID']== game) & (D['condition'] == 'closer')]['outcome'].mean())

    further_strokes, closer_strokes, further_svgLength, closer_svgLength, \
    further_svgStd, closer_svgStd, further_svgLengthPS, closer_svgLengthPS, \
    further_drawDuration, closer_drawDuration, further_accuracy, closer_accuracy = map(np.array, \
    [further_strokes, closer_strokes, further_svgLength, closer_svgLength,\
     further_svgStd, closer_svgStd, further_svgLengthPS, closer_svgLengthPS, \
    further_drawDuration, closer_drawDuration, further_accuracy, closer_accuracy])
    
    return further_strokes, closer_strokes, further_svgLength, closer_svgLength,\
     further_svgStd, closer_svgStd, further_svgLengthPS, closer_svgLengthPS, \
    further_drawDuration, closer_drawDuration, further_accuracy, closer_accuracy
    
def get_canonical(category):    
    stimFile = os.path.join(exp_dir,'stimList_subord.js')
    with open(stimFile) as f:
        stimList = json.load(f)    
    allviews = [i['filename'] for i in stimList if i['basic']==category]
    canonical = [a for a in allviews if a[-8:]=='0035.png']    
    return canonical

def get_actual_pose(subordinate,pose):
    stimFile = os.path.join(exp_dir,'stimList_subord.js')
    with open(stimFile) as f:
        stimList = json.load(f)
    inpose = [i['filename'] for i in stimList if (i['subordinate']==subordinate) and (i['pose']==pose)]
    return inpose
    
def get_subord_names(category):
    full_names = get_canonical(category)    
    return [c.split('_')[2] for c in full_names]

def get_basic_names(subordinate):
    stimFile = os.path.join(exp_dir,'stimList_subord.js')
    with open(stimFile) as f:
        stimList = json.load(f)   
    allviews = [i['filename'] for i in stimList if i['subordinate']==subordinate]
    canonical = [a for a in allviews if a[-8:]=='0035.png']      
    return canonical[0].split('_')[0]

def build_url_from_category(category):
    full_names = get_canonical(category)
    url_prefix = 'https://s3.amazonaws.com/sketchloop-images-subord/'
    urls = []
    for f in full_names:
        urls.append(url_prefix + f)
    return urls

def build_url_from_filenames(filenames):
    url_prefix = 'https://s3.amazonaws.com/sketchloop-images-subord/'
    urls = []
    for f in filenames:
        urls.append(url_prefix + f)
    return urls

def plot_from_url(URL):
    file = cStringIO.StringIO(urllib.urlopen(URL).read())
    img = Image.open(file)    

def plot_gallery(category):
    import matplotlib.pyplot as plt
    import matplotlib.gridspec as gridspec

    plt.figure(figsize = (8,8))
    gs1 = gridspec.GridSpec(8, 8)
    gs1.update(wspace=0.025, hspace=0.05)

    url_prefix = 'https://s3.amazonaws.com/sketchloop-images-subord/'
    for (i,c) in enumerate(category):
        URL = url_prefix + c
        file = cStringIO.StringIO(urllib.urlopen(URL).read())
        img = Image.open(file)
        p = plt.subplot(3,3,i+1)
        plt.imshow(img)
        p.get_xaxis().set_ticklabels([])
        p.get_yaxis().set_ticklabels([])
        p.get_xaxis().set_ticks([])
        p.get_yaxis().set_ticks([])
        p.set_aspect('equal')
        subord = c.split('_')[2]
        plt.title(subord)
    plt.tight_layout()
        