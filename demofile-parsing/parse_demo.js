const fs = require("fs");
const demofile = require("demofile");
const path = require("path");
const Round = require("./Round.js");
const ClipTemplate = require("./ClipTemplate.js");
const Logger = require('./Logger');
var demoGameStart = null;

// maps seconds time of demofile to timestamp of video
function secondsToTimestamp(seconds, demoStart, streamStart) {
  demoStart = demoStart || 0;
  seconds = seconds - demoStart + streamStart;
  var hours = Math.floor(seconds/3600);
  seconds = seconds%3600;
  var mins = Math.floor(seconds/60);
  seconds = Math.floor(seconds%60);
  hours = hours < 10 ? `0${hours}` : hours;
  mins = mins < 10 ? `0${mins}` : mins;
  seconds = seconds < 10 ? `0${seconds}` : seconds;
  return `${hours}h${mins}m${seconds}s`;
}


// Given a twitch vod or youtube video it will extract the video ID
function getVideoId(url) {
  var videoId = null;
  if (url.includes("youtube")) {
    videoId = url.split("v=")[1];
    var ampersand = videoId.indexOf('&');
    if (ampersand != -1) {
      videoId = videoId.substring(0, ampersand);
    }
  }
  Logger.debug(videoId);
  return videoId;
}

var parseDemo = function(url, demPath, streamGameStart){
  fs.readFile(path.resolve(demPath), (err, buffer) => {
    const demoFile = new demofile.DemoFile();
    const outputPage = new ClipTemplate(getVideoId(url));
    const rounds = [];
    var roundEvents = [];
    var roundLatestStart = 0;
    var roundOn = false;
    var roundIndex = 0;
  
    // parse start of the round
    demoFile.gameEvents.on("round_start", e => {
      roundOn = true;
      roundEvents = [];
      var t = demoFile.currentTime;
      roundLatestStart = t;
      // log round start
      Logger.log(`round ${roundIndex} started ${secondsToTimestamp(t, demoGameStart, streamGameStart)}`);
  
      Logger.debug(t);
    });
  
    // parse end of the round
    demoFile.gameEvents.on("round_end", e => {
      if(roundOn == true){
        roundOn = false;
        var t = demoFile.currentTime;
        var round = new Round(roundLatestStart, t, roundEvents);
        rounds.push(round);
        // set the demo file game start to start time of round 1
        demoGameStart = demoGameStart == null? roundLatestStart : demoGameStart;
        // generate highlights for the round
        round.sortKeyEvents();
        round.calculateEventRates();
        round.getHighRateTimes();
        round.mergeTimeRanges();
        round.getKills();
        Logger.log(round.getStreamTimestamps(demoGameStart, streamGameStart));
        // write highlights to output page
        outputPage.addRoundHighlights(round.highlights, demoGameStart, streamGameStart, roundIndex);
        outputPage.writeToFile("output.html");
        // reset roundEvents 
        roundEvents = [];
        // log round end
        Logger.log(`round ${roundIndex} ended ${secondsToTimestamp(t, demoGameStart, streamGameStart)}`);

        Logger.debug(round.plotAllEvents());
        Logger.debug('');
        Logger.debug(round.plotHighRates());
        Logger.debug('');
        Logger.debug(round.plotHighlightTimes());
        Logger.debug('');
        // round.getKills();
        Logger.debug(`set demoGameStart to: ${demoGameStart}`);

        roundIndex++;
      }
    });
  
    demoFile.gameEvents.on("player_death", e => {
      var t = demoFile.currentTime - 20;
      const attacker = demoFile.entities.getByUserId(e.attacker);
      const attackerName = attacker ? attacker.name : "unnamed";

      if(roundOn == true){
        deathEvent = { time: t, type: "player_death", attacker_name: attackerName};
        roundEvents.push(deathEvent);
      }
      
      const victim = demoFile.entities.getByUserId(e.userid);
      const victimName = victim ? victim.name : "unnamed";
      const headshotText = e.headshot ? " HS" : "";
      Logger.debug(`${attackerName} [${e.weapon}${headshotText}] ${victimName} -> ${secondsToTimestamp(t, demoGameStart, streamGameStart)}`);

    });
  
    // parse bomb_defuses
    demoFile.gameEvents.on("bomb_defused", e => {
      var t = demoFile.currentTime - 20;
      if(roundOn == true){
        bombDefuseEvent = { time: demoFile.currentTime, type: "bomb_defused" };
        roundEvents.push(bombDefuseEvent);
      }
      Logger.debug(`Bomb defused -> ${secondsToTimestamp(t, demoGameStart, streamGameStart)}`);
    });
  
    // parse bomb_planted
    demoFile.gameEvents.on("bomb_planted", e => {
      var t = demoFile.currentTime - 20;
      if (roundOn == true) {
        bombPlantEvent = { time: demoFile.currentTime, type: "bomb_planted" };
        roundEvents.push(bombPlantEvent);
      }
      Logger.debug(`Bomb planted -> ${secondsToTimestamp(t, demoGameStart, streamGameStart)}`);
    });
  
    demoFile.parse(buffer);
  });  
}

module.exports = parseDemo;
