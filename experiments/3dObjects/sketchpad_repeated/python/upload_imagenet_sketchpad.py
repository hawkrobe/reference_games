# quick and dirty upload script for imagenet subset for sketchpad game
# using the amazon credentials for sketchloop@gmail.com account
# jefan march 8 2017

import os
import boto

conn = boto.connect_s3()
b = conn.get_bucket('imagenet_sketchpad_2')

all_files = os.listdir('/Users/judithfan/imagenet_flattened')

for a in all_files:
	print a
	k = b.new_key(a)
	k.set_contents_from_filename(os.path.join('/Users/judithfan/imagenet_flattened',a))
	k.set_acl('public-read')