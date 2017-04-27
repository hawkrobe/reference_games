from __future__ import division
from boto.mturk.connection import MTurkConnection
from boto.mturk.connection import MTurkRequestError
from boto.mturk.price import Price
import numpy as np
import csv
import os
import pandas as pd
import json
import credentials ## This is sketchloop's amazon credentials        

# extracts all reviewable hits from your mturk account
def get_all_reviewable_hits(mtc):
    page_size = 50
    hits = mtc.get_reviewable_hits(page_size=page_size)
    print "Total results to fetch %s " % hits.TotalNumResults
    print "Request hits page %i" % 1
    total_pages = float(hits.TotalNumResults)/page_size
    int_total= int(total_pages)
    if(total_pages-int_total>0):
        total_pages = int_total+1
    else:
        total_pages = int_total
    pn = 1
    while pn < total_pages:
        pn = pn + 1
        print "Request hits page %i" % pn
        temp_hits = mtc.get_reviewable_hits(page_size=page_size,page_number=pn)
        hits.extend(temp_hits)
    return hits

# approves and grants bonus if possible
# Note: will only grant bonus if HIT was not already accepted...
def handle_assignment(mtc, assignment, bonus, message) :
    try :
        mtc.approve_assignment(assignment.AssignmentId)
        print "approved assignment" + assignment.AssignmentId
        if bonus > 0 :
            print "granting bonus of " + str(bonus) + " to " + assignment.AssignmentId
            mtc.grant_bonus(assignment.WorkerId, assignment.AssignmentId,
                            bonus, message)
    except MTurkRequestError as e:
        print e, assignment.AssignmentId, assignment.WorkerId, bonus


def filter(df,key,D): 
    '''
    filter values of df[key] that are already in D dataframe
    '''
    return [i for i in df[key] if i not in list(D[key])]

# get the AMT experiment metadata JSON files from production_results
PATH_TO_PRODUCTION_RESULTS = 'production-results'
results = os.listdir(PATH_TO_PRODUCTION_RESULTS)
bonus_multiplier = 3 # how many cents is a point worth in this game?
BONUS_DIR = 'bonus'
to_bonus = os.path.join(BONUS_DIR,'to_bonus.csv')
bonused = os.path.join(BONUS_DIR,'bonused.csv')

ACCESS_ID = credentials.ACCESS_ID
SECRET_KEY = credentials.SECRET_KEY
HOST = 'mechanicalturk.amazonaws.com'
message = "Thanks for participating!!" \
          "Send us an email at sketchloop@gmail.com if you have any questions."

####================================================#######
#### First, create CSV containing information about #######
#### which workers still need to be bonused         ######
####================================================#######

# get list of all bonus, workerID, assignmentID from production-results dir
d = []
for rfile in results:
    full_path = os.path.join(PATH_TO_PRODUCTION_RESULTS,rfile)
    with open(full_path,'r') as handle:
        parsed = json.load(handle)
        raw_score = parsed['answers']['subject_information']['score']
        d.append({'bonus': raw_score*bonus_multiplier/100, # convert to cents from dollars
                'wID':parsed['WorkerId'],
                'aID':parsed['AssignmentId']})
df = pd.DataFrame.from_dict(d)

# make sure that no single bonus is greater than 2 dollars
assert sum(np.array(df['bonus'])>2.00)==False

# filter to make sure not already bonused
if os.path.exists(bonused):
    print('Reading in master list of already bonused workers, and filtering so we only bonus the newest additions.')
    B = pd.read_csv(bonused)
    _aID = filter(df,'aID',B)
    _wID = filter(df,'wID',B)
    _bonus = filter(df,'bonus',B)
    b = pd.DataFrame({'aID':_aID, 'wID':_wID, 'bonus':_bonus})
    b.to_csv(to_bonus,index=False)
else: # master bonused list will match to_bonus list
    print('No one previously bonused, so bonus everyone.')  
    b = df
    b.to_csv(to_bonus,index=False)

print('Table of Workers to Bonus This Round')
print(b)
print('...')
####===============================================#######
#### Next, communicate with AMT to actually bonus  #######
#### these workers                                 ######
####===============================================#######
mtc = MTurkConnection(aws_access_key_id=ACCESS_ID,
                      aws_secret_access_key=SECRET_KEY,
                      host=HOST)

hits = get_all_reviewable_hits(mtc)
# Read in table of workers you need to bonus this time
# (assignmentid, workerid) is key, bonus amount is value
d = {}
with open(to_bonus) as csvfile :
    reader = csv.DictReader(csvfile)
    for row in reader :
        d[(row['aID'], row['wID'])] = float(row['bonus']) 

# Loop through all the assignments associated with all reviewable HITs,
# check whether each person appears in your csv and pay them if so
print('...')
for hit in hits:    
    assignments = mtc.get_assignments(hit.HITId)
    for assignment in assignments:
        key = (assignment.AssignmentId, assignment.WorkerId)
        if key in d :
            bonus = Price(d[key]) if key in d else 0
            print 'Now bonusing ' + str(key[0]) + ' ' + str(key[1]) + ' ' + str(bonus)
            ### handle_assignment(mtc, assignment, bonus, message)
            
## Read in master bonused list and concatenate newly bonused workers and save out
if os.path.exists(bonused):
    with open(bonused, 'a') as f:
        (b).to_csv(f, header=False, index=False)
else: # not yet a master bonused list so write to it for the first time
    b.to_csv(bonused, index=False)


