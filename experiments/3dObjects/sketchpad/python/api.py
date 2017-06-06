import StringIO
import copy
import collections

import base64
import gridfs

import hashlib
import tempfile
import json
import os
import numpy as np
import bson.json_util as json_util
from bson.objectid import ObjectId
import cPickle
#import tabular as tb
from PIL import Image

import tornado.web
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.autoreload
from tornado.options import define, options

from yamutils.mongo import SONify

import pymongo as pm

import zmq

define("port", default=9919, help="run on the given port", type=int)

#FEATURE_PORT = 38675
#SOCKET_CONTEXT = zmq.Context()
#FEATURE_SOCKET = SOCKET_CONTEXT.socket(zmq.PAIR)
#FEATURE_SOCKET.bind("tcp://*:%d" % FEATURE_PORT)
print('ready to connect')

#REGRESSORS = cPickle.load(open('/om/user/yamins/morph_regressors.pkl'))

class App(tornado.web.Application):
    """
        Tornado app which serves the API.
    """
    def __init__(self):
        handlers = [ (r"/savedecision",SaveDecisionHandler),
                    (r"/dbquery", DBQueryHandler)]
        settings = dict(debug=True)
        tornado.web.Application.__init__(self, handlers, **settings)


class BaseHandler(tornado.web.RequestHandler):
    def get(self):        
        args = self.request.arguments
        for k in args.keys():
            args[k] = args[k][0]
        args = dict([(str(x),y) for (x,y) in args.items()])  

        callback = args.pop('callback', None)   
        
        resp = jsonize(self.get_response(args))        

        if callback:
            self.write(callback + '(')
        self.write(json.dumps(resp, default=json_util.default))   
        if callback:
            self.write(')')
        print('sending!')
        self.finish()
  
  
PERM = None
PORT = int(os.environ.get('SKETCHLOOP_MONGO_PORT', 29202))
CONN = pm.MongoClient(port=PORT)

DB_DICT = {}
FS_DICT = {}
      
        
def isstring(x):
    try:
        x + ""
    except:
        return False
    else:
        return True
        
class DBQueryHandler(BaseHandler):

    def get_response(self, args):    
        global CONN
        dbname = args['dbname']
        colname = args['colname']        
        db = CONN[dbname]
        addfiles = bool(int(args.get('addfiles', '1')))
        if addfiles:
            coll = db[colname + '.files']
        else:
            coll = db[colname]
        querySequence = json.loads(args['query'])
        if isstring(querySequence):
            querySequence = [querySequence]
        querySequenceParsed = []
        for q in querySequence:
            if isstring(q):
                action = q
                posargs = ()
                kwargs = {}
            elif len(q) == 1:
                action = q[0]
                posargs = ()
                kwargs = {}
            elif len(q) == 2:
                action = q[0]
                if hasattr(q[1], "keys"):
                    kwargs = q[1]
                    posargs = ()
                else:
                    posargs = tuple(q[1])
                    kwargs = {}
            elif len(q) == 3:
                action = q[0]
                posargs = q[1]
                kwargs = q[2]
            assert action in ['find','find_one','group','skip',
                              'limit','sort','count','distinct'], action
            querySequenceParsed.append((action, posargs, kwargs))
    
        obj = coll                  
        for action, posargs, kwargs in querySequenceParsed:
            obj = getattr(obj, action)(*posargs, **kwargs)
        
        if isinstance(obj, pm.cursor.Cursor):
            result = list(obj)
        else:
            result = obj
        resp = {"result": result}
        return resp
 
    
class SaveDecisionHandler(BaseHandler):  
    def get_response(self,args):
        return save_decision_only(self,args)


def save_decision_only(handler,args):
    imhash = hashlib.sha1(json.dumps(args)).hexdigest()
    #print("imhash", imhash)
    filestr = 'filestr'
    global CONN
    print("args",args)
    dbname = args['dbname']
    colname = args['colname']
    global DB_DICT
    if dbname not in DB_DICT:
        DB_DICT[dbname] = CONN[dbname]
    db = DB_DICT[dbname]
    #print("db",db)
    global FS_DICT
    if (dbname, colname) not in FS_DICT:
        FS_DICT[(dbname, colname)] = gridfs.GridFS(db, colname)
    fs = FS_DICT[(dbname, colname)]    
    _id = fs.put(filestr, **args) # actually put file in db


def jsonize(x):
    try:
        json.dumps(x)
    except TypeError:
        return SONify(x)
    else:
        return x


def main():
    """
        function which starts up the tornado IO loop and the app. 
    """
    tornado.options.parse_command_line()
    ioloop = tornado.ioloop.IOLoop.instance()
    http_server = tornado.httpserver.HTTPServer(App(), max_header_size=10000000)
    http_server.listen(options.port)
    tornado.autoreload.start()
    ioloop.start()
    

if __name__ == "__main__":
    main()

