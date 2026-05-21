const canvas = document.getElementById("myCanvas");
const c = canvas.getContext("2d");

const fireworkTrailLength = 100
const colorKeyListBackup = [...colorKeyList]
// check this out

let showFirework = false;
let showParticleFallingAnimation = true;

var deathParticles = []
let subDeathParticles = []
let nonExplodedParticles = [];
let currentTargetedCoords = [];
let coordObjSorted = {}
let coordObjSortedOriginal = {}
let lengthOfOriginalArray = 0;
let lengthOfColorArray = colorKeyList.length
let totalRendered = 0;
let totalOnGrid = 0;
let expiredColors = 0;
let fireworkScale = 1;
let finishedRender = false

let arrayDepth = 1;
const coordArr = [];
for (let i = 0; i < input.length; i++) {
    for (let j = 0; j < input[i].length; j++) {
        if (input[i][j] >= 0) {
            coordArr.push({x: (j*arrayDepth), y: (i*arrayDepth), colID: input[i][j], colName: colorKeyList[input[i][j]]})
        }
    }
}

coordArr.forEach(obj => {
    if (!coordObjSorted[obj.colName]) {
        coordObjSorted[obj.colName] = []
        coordObjSortedOriginal[obj.colName] = []
    } 

    coordObjSorted[obj.colName].push(obj)
    coordObjSortedOriginal[obj.colName].push(obj)
})

/* coordObjSorted is as follows:
{
color1: [{x, y, colID, colName}, {x, y, colID, colName}, ...],
color2: [{x, y, colID, colName}, {x, y, colID, colName}, ...]}
*/

console.log(coordObjSorted)


lengthOfOriginalArray = coordArr.length;

const defaultHeight = 633 // 700?
const defaultWidth = 1366// 1366?
const inputWidth = input[0].length
const inputHeight = input.length

// frame for HAPPY FATHER'S DAY! is 171 (width) x 24 (height).

let maximumArtHeight = 0.8
let maximumArtWidth = 1.0

let textFrameHeight;
let textFrameWidth;
if ((inputHeight / inputWidth) > ((maximumArtHeight*window.innerHeight) / (maximumArtWidth*window.innerWidth))) {
    textFrameHeight = window.innerHeight * maximumArtHeight
    textFrameWidth = textFrameHeight * (inputWidth / inputHeight)
} else {
    textFrameWidth = window.innerWidth * maximumArtWidth
    textFrameHeight = textFrameWidth * (inputHeight / inputWidth)
}

let textFrameLocX = (window.innerWidth / 2) - (textFrameWidth / 2)
let textFrameLocY = window.innerHeight - textFrameHeight
let textFramePixelSize = textFrameWidth / inputWidth / arrayDepth
const vertScale = window.innerHeight / defaultHeight
const horizScale = window.innerWidth / defaultWidth
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const fireworkSize = textFramePixelSize*9

const frozenCanvas = document.createElement("canvas");
frozenCanvas.width = canvas.width;
frozenCanvas.height = canvas.height;
const frozenCtx = frozenCanvas.getContext("2d");

// ONLY USED IN BOTTOM-TOP MODE
const potentialCoords = [] // all potential points that particles can glide to 
for (let i = 0; i < inputWidth; i++) {
    potentialCoords.push({x: i, y: inputHeight-1})
}

console.log(potentialCoords)
potentialCoordsLength = potentialCoords.length

// I AM SMART YAY I accidentally figured out the cauchy distribution 😎

// returns between [-1.26, 1.26]
function determineDistXPos(rand) {
    if (rand < 0.05 || rand > 0.95) {
        return (Math.random() * 2) - 1
    } else {
        return 0.5 * Math.tan((Math.PI * rand) + (Math.PI / 2))
    }
}


function explode(x, y, size, numParticles){
    // console.log(potentialCoords)
    subDeathParticles = [];
    let radius = 5

    // translate the firework into gridX.
    let translatedX = Math.round((x - textFrameLocX) / textFramePixelSize)
    let variationXScale = 3;
    console.log(potentialCoordsLength)
    for (let k = 0; k < numParticles; k++){
        let particleLife;
        let targetCoordX = null
        let targetCoordY = null
        let targetGridX = null
        let targetGridY = null
        
        //console.log(colorKeyList)
        // im assuming colorKeyList is ["clr1", "clr2", etc...]

        let colorID = Math.floor(Math.random()*(colorKeyList.length))
        let colorName = colorKeyList[colorID]

        let ang = k*((Math.PI*2)/numParticles)
        let xAng = Math.cos(ang)

        let variationX = determineDistXPos(Math.random()) * size
        // let scaledVariationX = (variationX + variationXScale) / (variationXScale * 2) // scales it between 0 and 1.
        let variationY = determineDistXPos(Math.random()) * size * 0.75
        let initGravity = (2 + variationY) + variationY * (window.innerHeight / defaultHeight)*Math.abs(Math.sin(ang))

        if (Math.random() < 0 || !coordObjSorted[colorName] || coordObjSorted[colorName].length == 0 || potentialCoords.length == 0) {
            // let one half of the particles not get sucked into the text.
            particleLife = 300
        } else {

            // let index = Math.floor(Math.random() * coordObjSorted[colorName].length)

            // if this is random
            /*
            let index = coordObjSorted[colorName].length-1
            targetGridX = coordObjSorted[colorName][index].x
            targetGridY = coordObjSorted[colorName][index].y
            targetCoordX = (targetGridX * textFramePixelSize) + textFrameLocX
            targetCoordY = (targetGridY * textFramePixelSize) + textFrameLocY*/

            // if we're doing bottom-up
            
            let index = Math.floor(translatedX + (variationX * (inputWidth / 6)))
            
            if (index < 0) {
                index = 0
            } else if (index > inputWidth-1) { 
                index = inputWidth-1
            }

            if (index >= potentialCoords.length) {
                index = Math.floor(Math.random()*potentialCoords.length)
            }

            targetGridX = potentialCoords[index].x
            targetGridY = potentialCoords[index].y

            if (potentialCoords[index].y > 0) {
                potentialCoords[index].y -= 1
            } else {
                let temp = potentialCoords[index]
                potentialCoords[index] = potentialCoords[potentialCoords.length - 1]
                potentialCoords[potentialCoords.length - 1] = temp // push to the end of the list
                potentialCoords.pop()
                potentialCoordsLength -= 1
                // potentialCoords.splice(index, 1)
            }

            targetCoordX = (targetGridX * textFramePixelSize) + textFrameLocX
            targetCoordY = (targetGridY * textFramePixelSize) + textFrameLocY

            colorID = input[targetGridY][targetGridX]
            colorName = colorKeyList[colorID]

            if (initGravity > 0) {
                particleLife = Math.ceil((targetCoordY - y)/canvas.height*100) + Math.abs(initGravity * 10)
            } else {
                particleLife = Math.ceil((targetCoordY - y)/canvas.height*100) - Math.abs(initGravity * 10)
            }

            if (particleLife <= 1) {
                particleLife = 10
            }
            
            // if random mode, this removes the last point of that particular color.
            // if bottom-top mode, this doesn't do anything except keeps track of the number of points left per color.
            // coordObjSorted[colorName].pop() // 

            // if bottom-top mode
            // no need to do anything.

            // if there is no more of that particular color to fill.
            if (coordObjSorted[colorName].length == 0) {
                // console.log("Removing " + colorName + " from array. Remaining colors: " + (colorKeyList.length - 1))
                // console.log("Current array: " + colorKeyList)
                let temp = colorKeyList[colorID]
                colorKeyList[colorID] = colorKeyList[colorKeyList.length - 1]
                colorKeyList[colorKeyList.length - 1] = temp // push to the end of the list
                colorKeyList.pop()
                expiredColors+=1

            }
            
            totalRendered += 1
        }

        subDeathParticles.push({
            x: x+(radius*Math.cos(ang)),
            y: y+(radius*Math.sin(ang)),
            variationX: variationX,
            variationY: variationY,
            angle: ang,
            size: fireworkSize/2,
            initGravity: initGravity,
            particleColor: colorName,
            colorID: colorID,
            loop: 0,
            targetX: targetCoordX,
            gridTargetX: targetGridX,
            targetY: targetCoordY,
            gridTargetY: targetGridY,
            life: particleLife,
        })
    }
    deathParticles.push(subDeathParticles)
    
    //console.log(coordObjSorted)
}
            

function updateDeathParticles(){
    let i = 0;
    let j = 0;
    while (i < deathParticles.length){
        j = 0;
        while (j < deathParticles[i].length){
            // move it, regardless if it has targetX or not.
            if (deathParticles[i][j].loop < deathParticles[i][j].life){
                deathParticles[i][j].x += Math.cos(deathParticles[i][j].angle)*0.75 + deathParticles[i][j].variationX - (deathParticles[i][j].loop / deathParticles[i][j].life)
                deathParticles[i][j].y -= deathParticles[i][j].initGravity
                deathParticles[i][j].initGravity -= 0.1
                deathParticles[i][j].loop++;
                
                j++
            } else {
                // when initial particle life has expired.

                if (deathParticles[i][j].targetX) {
                    // if there is a gliding animation to targetX/targetY.

                    if (!deathParticles[i][j].exitLoop && !deathParticles[i][j].exitLife) {
                        // if this is the first frame of the gliding animation to targetX/targetY, compute the angle and gravity needed.

                        deathParticles[i][j].exitLoop = 0
                        let computedGravity = deathParticles[i][j].initGravity

                        if (Math.abs(computedGravity) < 3) {
                            // console.warn("Computed gravity is quite low. Setting it to 2")
                            computedGravity = 3
                        }

                        if (deathParticles[i][j].y  - deathParticles[i][j].targetY > 0 && computedGravity < 0) {
                            // if the particle is below the target tile.
                            computedGravity = 0-computedGravity // make the gravity positive so the particle goes up.
                        } else if (deathParticles[i][j].y  - deathParticles[i][j].targetY < 0 && computedGravity > 0) {
                            computedGravity = 0-computedGravity
                        }

                        const computedExitLife = Math.abs(Math.ceil((deathParticles[i][j].y - deathParticles[i][j].targetY) / computedGravity))
                        
                        deathParticles[i][j].exitLife = computedExitLife
                        deathParticles[i][j].exitGravity = computedGravity
                        deathParticles[i][j].exitXIncr = (deathParticles[i][j].targetX - deathParticles[i][j].x) / computedExitLife
                        deathParticles[i][j].exitSizeChange = (deathParticles[i][j].size - (textFramePixelSize / 2)) / computedExitLife

                    } else if (deathParticles[i][j].exitLoop < deathParticles[i][j].exitLife){
                        // update the deathparticles to move towards targetX, targetY.
                        deathParticles[i][j].x += deathParticles[i][j].exitXIncr
                        deathParticles[i][j].y -= deathParticles[i][j].exitGravity
                        deathParticles[i][j].size -= deathParticles[i][j].exitSizeChange
                        deathParticles[i][j].exitLoop++;

                    } else if (deathParticles[i][j].exitLoop >= deathParticles[i][j].exitLife) {
                        // if the death particle has frozen.
                        frozenCtx.fillStyle = deathParticles[i][j].particleColor

                        // console.log("colorID is: " + colorID)
                        /*
                        if (deathParticles[i][j].particleColor != colorKeyListBackup[colorID]) {
                            console.warn("At x: " + deathParticles[i][j].targetX + " y: " + deathParticles[i][j].targetY, "(gridX: " +  deathParticles[i][j].gridTargetX + ", gridY: " + deathParticles[i][j].gridTargetY + ") there is a color discrepancy. The expected color is: " + colorKeyListBackup[colorID] + "(colorID " + colorID + ") while the actual color is: " + deathParticles[i][j].particleColor + " (colorID " + deathParticles[i][j].colorID + ")")
                            mismatchedColors++
                        }
                        */
                       
                        frozenCtx.beginPath()
                        //frozenCtx.fillRect(deathParticles[i][j].targetX, deathParticles[i][j].targetY, textFramePixelSize, textFramePixelSize);
                        frozenCtx.arc(deathParticles[i][j].targetX+(textFramePixelSize/2), deathParticles[i][j].targetY+(textFramePixelSize/2), textFramePixelSize/2, 0, Math.PI*2)
                        totalOnGrid++
                        frozenCtx.fill()
                        frozenCtx.closePath()

                        deathParticles[i].splice(j, 1)
                        j--;
                    } else {
                        console.log("SAY WHAT 🤭")
                    }
                   j++;
                } else {
                    // if there is no gliding animation to targetX/targetY.
                    deathParticles[i].splice(j, 1)
                    j++;
                }
            }
        }
        if(deathParticles[i].length == 0){
            deathParticles.splice(i, 1)
            i--;
        }
        i++;
    }
}

let size;
function drawDeathParticles(){
    for(let i = 0; i < deathParticles.length; i++){
        for(let j = 0; j < deathParticles[i].length; j++){
            size = deathParticles[i][j].size
            c.beginPath()
            c.save()
            if (!deathParticles[i][j].targetX) {
                // if the particles have no target, render the fading opacity.
                c.globalAlpha = 1-(deathParticles[i][j].loop/deathParticles[i][j].life);
            } else {
                c.globalAlpha = 1
            }

            let particleX = deathParticles[i][j].x
            let particleY = deathParticles[i][j].y
            if (deathParticles[i][j].targetX || 
                (!deathParticles[i][j].targetX && !(particleX > textFrameLocX && particleX < textFrameLocX + textFrameWidth && particleY > textFrameLocY && particleY < textFrameLocY + textFrameHeight))) {
                    if (showParticleFallingAnimation) {
                        c.beginPath()
                        c.rect(deathParticles[i][j].x-size, deathParticles[i][j].y-size, size, size)
                        
                        //c.arc(deathParticles[i][j].x+(size), deathParticles[i][j].y+(size), size, 0, Math.PI*2)
                        c.lineWidth = 1;
                        c.strokeStyle = "white";
                        c.fillStyle = deathParticles[i][j].particleColor;
                        //c.stroke()
                        c.fill()
                        c.closePath()
                    }
            }
            
            c.closePath()
            c.restore()
        }
    }
}

function initParticle(){
    let randomX = Math.round(Math.random()*textFrameWidth)+textFrameLocX
    let nParticles = 1000
    let expSize = 1.25
    // let randomX = Math.round(Math.random()*window.innerWidth)+0
    if(Math.round(Math.random()) == 1){
        //default fireworks
        nonExplodedParticles.push({x: randomX, y: window.innerHeight, initGravity: 0-((Math.random()*3)+4.5)*(window.innerHeight/defaultHeight), type: "default", trail: [], expSize: expSize, numParticles: nParticles})
    }else{
        //curvy fireworks
        
        //let randomX = Math.round(Math.random()*window.innerWidth)+0
        let amplitude = ((Math.random()*40)+10)*(window.innerHeight/defaultHeight)
        let initGravity = 0-((Math.random()*4)+4)*(window.innerHeight/defaultHeight)
        let frequency = Math.round(Math.random()*6)+3
        nonExplodedParticles.push({x: randomX, y: window.innerHeight, initGravity: initGravity, amplitude: amplitude, type: "curvy", loop: 0, referenceX: randomX, freq: frequency, trail: [], expSize: expSize, numParticles: nParticles})

        if (Math.random() < 0.25) {
            nonExplodedParticles.push({x: randomX, y: window.innerHeight, initGravity: initGravity, amplitude: 0-amplitude, type: "curvy", loop: 0, referenceX: randomX, freq: frequency, trail: [], expSize: expSize, numParticles: nParticles})
        }
    }
}

function updateInitParticle(){
    let i=0;
    while(i < nonExplodedParticles.length){
        if(nonExplodedParticles[i].initGravity < -0.8){
            if(nonExplodedParticles[i].type == "default"){
                //runs if default
                
                nonExplodedParticles[i].y += nonExplodedParticles[i].initGravity
                nonExplodedParticles[i].initGravity += 0.05
            }else{
                //runs if curvy
                nonExplodedParticles[i].y += nonExplodedParticles[i].initGravity
                nonExplodedParticles[i].initGravity += 0.05;
                nonExplodedParticles[i].x = nonExplodedParticles[i].referenceX + (nonExplodedParticles[i].amplitude)*Math.sin((nonExplodedParticles[i].loop*nonExplodedParticles[i].freq)*(Math.PI/180));
                nonExplodedParticles[i].loop++;
            }

            // nonExplodedParticles[i].trail.push({x: nonExplodedParticles[i].x, y: nonExplodedParticles[i].y, transparency: 1, size: fireworkSize, color: colorKeyList[Math.floor(Math.random()*colorKeyList.length)] })

            nonExplodedParticles[i].trail.push({x: nonExplodedParticles[i].x, y: nonExplodedParticles[i].y, transparency: 1, size: fireworkSize, color: "white" })

            let ind = 0

            while (ind < nonExplodedParticles[i].trail.length) {
                nonExplodedParticles[i].trail[ind].transparency -= 1 / fireworkTrailLength
                nonExplodedParticles[i].trail[ind].size -= fireworkSize / fireworkTrailLength

                if (nonExplodedParticles[i].trail[ind].transparency <= 0) {
                    nonExplodedParticles[i].trail.splice(ind, 1)
                }
                ind++
            }
        }else{
            explode(nonExplodedParticles[i].x, nonExplodedParticles[i].y, nonExplodedParticles[i].expSize, nonExplodedParticles[i].numParticles);
            nonExplodedParticles.splice(i, 1);
            i--;
        }
        i++;
    }
}

function drawInitParticle(){
    for(let i = 0; i < nonExplodedParticles.length; i++){
        nonExplodedParticles[i].trail.forEach(trailParticle => {
            c.beginPath()
            c.save()
            c.globalAlpha = trailParticle.transparency

            c.rect(trailParticle.x-trailParticle.size/2, trailParticle.y-trailParticle.size/2, trailParticle.size, trailParticle.size)
            c.fillStyle = trailParticle.color
            c.fill()
            
            c.closePath()
            c.restore()
        })
        
        if (showFirework) {
            c.beginPath()
            c.rect(nonExplodedParticles[i].x-(fireworkSize), nonExplodedParticles[i].y-(fireworkSize), fireworkSize*2, fireworkSize*2)
            c.fillStyle = "white"
            c.fill()
            c.closePath()
        }
    }
}
let breakFramesBetweenText = 0;

function clr() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    setInterval(frame, 10)
}

function frame(){

    c.clearRect(0, 0, canvas.width, canvas.height);
    c.drawImage(frozenCanvas, 0, 0);
    if(Math.floor(Math.random()*150) == 1 && (totalRendered <= lengthOfOriginalArray*0.999)){
        initParticle();
    } else if (totalRendered >= lengthOfOriginalArray && deathParticles.length == 0) {
        //finishedRender = true
        //clearInterval(interval)
        //setTimeout(clr, 1000)
        clearInterval(interval)
        console.log("hi")
        Object.keys(expectedColorDistribution).forEach(e => {
            if (expectedColorDistribution[e] == actualColorDistribution[e]) {
                // console.log("✅ " + e + " is accounted for.")
            } else {
                console.log("❌ " + e + " is NOT accounted for. Expected: " + expectedColorDistribution[e] + ", actual" + expectedColorDistribution[e])
            }
        })
    }
    // c.fillStyle = 'black'
    c.rect(textFrameLocX, textFrameLocY, textFrameWidth, textFrameHeight)
    c.strokeWidth = 5;
    c.strokeStyle = 'grey'
    c.stroke()

    c.beginPath()
    c.save()
    /*
    c.globalAlpha = 0.40
    c.fillStyle = "#303030"
    c.fillRect(textFrameLocX+(textFrameWidth*0.05), textFrameLocY+(textFrameHeight*0.67), (textFrameWidth*0.9), (textFrameHeight*0.18))
    
    c.restore()

    c.textAlign = "center";
    c.textBaseLine = "middle";

    c.font = 40  + "px inconsolata";
    c.fillStyle = "white"
    c.strokeStyle = "white"

    c.fillText("Loading pixels!", textFrameLocX+(textFrameWidth*0.5), (textFrameHeight*0.73));

    // outer rectangle
    c.strokeRect(textFrameLocX+(textFrameWidth*0.1), textFrameLocY+(textFrameHeight*0.77), (textFrameWidth*0.8), (textFrameHeight*0.06))

    c.fillStyle="#2469d6"

    // progress bar
    c.fillRect(textFrameLocX+(textFrameWidth*0.1), textFrameLocY+(textFrameHeight*0.77), (textFrameWidth*0.8)*(((totalOnGrid)/lengthOfOriginalArray)), (textFrameHeight*0.06))

    c.fillStyle="white"
    c.textAlign="left"
    c.font = 30  + "px inconsolata";
    c.textBaseLine = "middle";
    // text
    c.fillText(totalOnGrid + "/" + lengthOfOriginalArray + " (" + (((totalOnGrid)/lengthOfOriginalArray)*100).toFixed(2) + "%)", textFrameLocX+(textFrameWidth*0.12), (textFrameHeight*0.81));

    c.closePath()
    */
    c.font = 15  + "px inconsolata";
    c.textAlign = "left";
    c.beginPath()


    c.fillText("On Grid: " + totalOnGrid + "/" + lengthOfOriginalArray + " (" + (((totalOnGrid)/lengthOfOriginalArray)*100).toFixed(2) + "%)", 10, 25);

    // outer rectangle
    c.strokeRect(10, 35, 200, 15)

    c.fillStyle="#2469d6"

    c.fillRect(10, 35, 200*(((totalOnGrid)/lengthOfOriginalArray)), 15)

    c.fillStyle = "white"

    c.fillText("Unique colors left: " + colorKeyList.length, 10, 65);
    c.closePath()

    drawInitParticle()
    updateInitParticle()
    
    drawDeathParticles()
    updateDeathParticles()
}

var interval = setInterval(frame, 10);

// for debugging
function DEBUG_ORIGINAL() {
    clearInterval(interval)
    c.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < input.length; i++) {
        for (let j = 0; j < input[i].length; j++) {
            const value = input[i][j]
            if (value >= 0) {
                c.fillStyle = colorKeyListBackup[value];
                c.fillRect(
                    textFrameLocX + (j * textFramePixelSize),
                    textFrameLocY + (i * textFramePixelSize),
                    textFramePixelSize,
                    textFramePixelSize
                );
            }
        }
    }
}
