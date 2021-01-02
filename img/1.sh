#!/bin/bash

identify **/*.png **/*.jpg | grep -o '[0-9]\{1,5\}x[0-9]\{1,5\}' > ./tmp.list

sum=0
num=$(awk '{print NR}' ./tmp.list | tail -n1)

while read SIZE
do
    arrsize=($(echo $SIZE | sed 's|x|\/|g'))
    i=$(echo | awk "{print $arrsize}")
    tmp=$(echo | awk "{print $sum+$i}")
    sum=${tmp}

done < ./tmp.list

rm -rf ./tmp.list
echo | awk "{print $sum/$num}"
echo | awk "{print $num/$sum}"
