from PIL import Image
import numpy as np
import math
import sys

# Load the image
img = Image.open('C://Users//mchlc//Downloads//allison_sunset_l_lighter.png')

# Convert to a NumPy array (grayscaled or RGB)
# For grayscale:
# gray_array = np.array(img.convert("L"))

# For RGB:
rgb_array = np.array(img)

arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"]

def convertToHex(num):
    if (num < 16):
       return "0" + arr[num]
    else:
        remainder = num%16
        return arr[math.floor(num/16)] + "" + arr[remainder]

h, w, l = rgb_array.shape

hex_array = np.empty((h, w), dtype=object)

for row in range (len(rgb_array)):
    for col in range (len(rgb_array[row])):
        r = convertToHex(rgb_array[row, col, 0])
        g = convertToHex(rgb_array[row, col, 1])
        b = convertToHex(rgb_array[row, col, 2])
        hex_array[row, col] = "#" + str(r) + str(g) + str(b)

np.set_printoptions(threshold=np.inf)

colorDict = {}

print("")
print("const input = [", end="")
for row in range (len(hex_array)):
    print("[", end="")
    for col in range (len(hex_array[row])):
        endString = ""
        item = hex_array[row, col]
        if (col < len(hex_array[row])-1):
            endString = ", "
            
        if (item == "#000000"):
            print("-1", end=endString)
        else:
            if (len(sys.argv) == 1):
                if (item in colorDict.keys()):
                    print(str(colorDict[item]), end=endString)
                else:
                    colorDict[item] = len(colorDict.keys())
                    print(len(colorDict.keys())-1, end=endString)
            elif (len(sys.argv) == 2 and sys.argv[1] == "bw"):
                print(1, end=endString)
                
    print("],")
print("]", end="")
print("")
print("// length of color array is: " + str(len(colorDict.keys())))
print("const colorKeyList = [", end="")
for key in colorDict.keys():
    print("'" + key + "'", end=", ")
print("]")
print("")

            
        
#with open("imgdata.txt", 'w', encoding='utf-8') as f:
#   f.write(str(hex_array))

#print(hex_array)
