const demofile = require("demofile");

class Round {

  constructor (startTime, endTime, keyEvents) {
    this.startTime = startTime || null;
    this.endTime = endTime || null;
    this.keyEvents = keyEvents || [];
    this.eventRates = [];
    this.highRateTimes = [];
    this.highlights = [];
  }

  // check if a time is within the round
  inRound(time) {
    return this.startTime <= time && this.endTime >= time;
  }

  pushKeyEvent(keyEvent) {
    this.keyEvents.push(keyEvent);
  }

  sortKeyEvents() {
    this.keyEvents.sort(this.compare);
  }

  compare( a, b ) {
    if ( a.time < b.time ){
      return -1;
    }
    if ( a.time > b.time ){
      return 1;
    }
    return 0;
  }

  calculateEventRates(roundIndex) {
    var i;
    for (i = 0; i+1 < this.keyEvents.length; i++) {
      var deltaTime = this.keyEvents[i+1].time - this.keyEvents[i].time;
      if (deltaTime == 0) { continue; }
      var rate = 1/deltaTime;
      this.eventRates.push(rate);
    }
    console.log(`==== Round ${roundIndex}`);
  }

  getHighRateTimes() {
    // find average rate
    var total = 0;

    for(var i = 0; i < this.eventRates.length; i++) {
        total += this.eventRates[i];
    }
    var avg = total / this.eventRates.length;

    var times = [];
    // const highlightLength = 10;
    for(var j = 0; j < this.eventRates.length; j++) {
      if (this.eventRates[j] > avg) {
        var start = this.keyEvents[j].time - 2;
        var end = this.keyEvents[j+1].time + 2;
        this.highRateTimes.push([start, end]);
      }
    }
    console.log("High-Rate Times (Before Merge):");
    console.log(this.highRateTimes); 
  }

  mergeTimeRanges() {
    var i = 0;
    var j = 1;
    var tmp = [this.highRateTimes[i]];
    while (j < this.highRateTimes.length) {
      var rangeA = tmp[i];
      var rangeB = this.highRateTimes[j];
      if (this.timesOverlap(rangeA, rangeB)) {
        tmp[i][0] = Math.min(rangeA[0], rangeB[0]);
        tmp[i][1] = Math.max(rangeA[1], rangeB[1]);
        j++;
      } else {
        tmp.push(rangeB);
        i++;
        j++;
      }
    }
    this.highlights = tmp;
    console.log("Final Round Highlights:");
    console.log(this.highlights);
  }

  timesOverlap(timeA, timeB) {
    var [startA, endA] = timeA;
    var [startB, endB] = timeB;
    return ((startB <= endA) || (endA >= startB));
  }

  getKills() {

    // Keeping a ledger of the name of the killer for each kill in the round.
    var roundKillerNames = [];
    for (var i = 0; i < this.keyEvents.length; i++) {

      // If the event is a player death add the killer to the array.
      if (this.keyEvents[i].type == 'player_death') {
        console.log(this.keyEvents[i]);
        roundKillerNames.push(this.keyEvents[i].attacker_name);
      }
    }
    this.countKills(roundKillerNames);
  }

  countKills(inputArray) {
    
    // counts object for the round with <key String, Value Int> = <playerName, numberOfKillsInCurrentRound>.
    var counts = {};
    inputArray.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });
    console.log(counts);

    Object.keys(counts).forEach(function(key){
      if((counts[key]) == 4) {
        console.log(key + ' got 4 kills');  
      }  
      if((counts[key]) == 5) {
        console.log(key + ' got 5 kills');  
      }  
    });
  }
}

module.exports = Round;
