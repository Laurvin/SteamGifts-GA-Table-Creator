// ==UserScript==
// @name SteamGifts GA Table Creator
// @namespace SteamGifts GA Table Creator
// @author Laurvin
// @description Creates a table of all giveaways you've created with links to the Steam product page and the GA page. RaChart compatible.
// @version 0.5
// @icon http://i.imgur.com/XYzKXzK.png
// @downloadURL https://github.com/Laurvin/SteamGifts-GA-Table-Creator/raw/master/SteamGifts_GA_Table_Creator.user.js
// @include https://www.steamgifts.com/giveaways/created*
// @grant GM_xmlhttpRequest
// @require http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @run-at document-idle
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);
$(document).ready(function ()
{
  init();
});
function init()
{
  addHTMLElements();
}
function addHTMLElements() // Adds a button and two text areas for the tables.
{
  $('.sidebar').append('<button class="sidebar__action-button" id="CreateTables">Create Giveaway Tables</button>');
  $('#CreateTables').click(TraverseGAs);
  $('.sidebar').append('<p><br /><strong>Giveaway Title</strong><br /><input id="GiveawayTitle" type="text" placeholder="Giveaway" title="Any text here will be displayed as the name of the link to the giveaways. If this is empty then we display the link. So if you enter the word Giveaway then all links will be called this in the column. All this only works for the SG Table and not for the Excel Table."></input></p>');
  $('.sidebar').append('<p><br /><strong>Extra Columns</strong><br /><input id="ExtraColumns" type="text" placeholder="|Column 1|Column 2" title="Add any extra columns you would like here. Separate them with | like normal Start with a | and do not add spaces around the | if you want to copy to Excel. Anything filled out here will be repeated for every row in the table."></input></p>');
  $('.sidebar').append('<div id="ResStor"></div>');
}
function TraverseGAs()
{
  $('.page__heading').before('<div id="HoldingArea"></div>');
  $('.page__heading').css("clear","left");
  $('#HoldingArea').append('<div style="width: 50%; float: left;"><br /><strong>SG Table</strong><br /><textarea id="SGTable" style="overflow: hidden;"></textarea></div>');
  $('#HoldingArea').append('<div style="width: 50%; float: right;"><br /><strong>Excel Table</strong><br /><textarea id="ExcelTable" style="overflow: hidden;"></textarea></div>');
  
  // Adding Table headers to SG Table box.
  var ExtraColumnInfo = $('#ExtraColumns').val();
  var Headers = 'Steam | Giveaway' + ExtraColumnInfo;
  var NumberOfAligners = (Headers.match(/\|/g) || []).length;
  var Aligners = Array(NumberOfAligners+2).join(":-|");
  Aligners = Aligners.slice(0, -1);
  var SGTable = $('#SGTable');
  SGTable.val(SGTable.val() + Headers + '\n');
  SGTable.val(SGTable.val() + Aligners + '\n');

  $('.table__row-outer-wrap').each(function ()
  {
    var GAlink = $(this).find('a.table__column__heading').attr('href');
    var MinusName = GAlink.substring(0, GAlink.lastIndexOf('/')); // Removes game name from link.
    var JustSlug = MinusName.substring(MinusName.lastIndexOf('/') + 1); // Saves just the slug.
    var GameName = $(this).find('a.table__column__heading').text();
    var NoImage = $(this).find('a.global__image-outer-wrap--missing-image').attr('href');
    if (typeof NoImage !== 'undefined')
    {
      GetSteamInfo(GameName, JustSlug);
    }
    else
    {
      var ImgUrl = $(this).find('div.global__image-inner-wrap').css('background-image');
      var SubstrStart = ImgUrl.indexOf('akamaihd.net/steam/') + 18;
      var SubstrEnd = ImgUrl.lastIndexOf('/') + 1;
      var SteamUrlPart = ImgUrl.substring(SubstrStart, SubstrEnd);
      SteamUrlPart = SteamUrlPart.replace("apps", "app"); // No idea why the added the S in the urls for the images.
      SteamUrlPart = SteamUrlPart.replace("subs", "sub");
      var FullSteamLink = 'http://store.steampowered.com' + SteamUrlPart;
      CreateTableRows(GameName, JustSlug, FullSteamLink);
    }
  });
}
function GetSteamInfo(fnGameName, fnJustSlug)
{
  GM_xmlhttpRequest({
    method: 'GET',
    url: 'http://store.steampowered.com/search/suggest?term=' + encodeURI(fnGameName) + '&f=games',
    timeout: 3000,
    onload: function (response)
    {
      $('#ResStor').append('<div id="id' + fnJustSlug + '" style="display: none;">' + response.responseText + '</div>');
      var FullSteamLink;
      $('#id' + fnJustSlug + ' a > div').each(function ()
      {
        if ($(this).text() === fnGameName)
        {
          FullSteamLink = $(this).parent().attr('href');
        }
      });
      if (FullSteamLink === undefined) // No luck? Then we load the GA page and grab the link from there.
      {
        GM_xmlhttpRequest({
          method: 'GET',
          url: 'https://www.steamgifts.com/giveaway/' + fnJustSlug + '/',
          timeout: 3000,
          onload: function (response)
          {
            $('#ResStor').append('<div id="SGid' + fnJustSlug + '" style="display: none;">' + response.responseText + '</div>');
            FullSteamLink = $('#SGid' + fnJustSlug + ' a.global__image-outer-wrap--game-large').attr('href');
            if (FullSteamLink === undefined)
            {
              var fnSteamLink = 'NO LINK FOUND';
            } 
            else
            {
              var fnSteamLink = FullSteamLink;
            }
            CreateTableRows(fnGameName, fnJustSlug, fnSteamLink);
          }
        });
      } 
      else
      {
        var fnSteamLink = FullSteamLink.substring(0, FullSteamLink.lastIndexOf('/') + 1); // Removes ? and everything after.
        CreateTableRows(fnGameName, fnJustSlug, fnSteamLink);
      }
    },
    onerror: function (response)
    {
      var fnSteamLink = 'ERROR OCCURED TRYING TO REACH STEAM';
      CreateTableRows(fnGameName, fnJustSlug, fnSteamLink);
    },
    ontimeout: function (response)
    {
      var fnSteamLink = 'TIMEOUT GETTING DATA FROM STEAM';
      CreateTableRows(fnGameName, fnJustSlug, fnSteamLink);
    }
  });
}
function CreateTableRows(fnGameName, fnJustSlug, fnSteamLink)
{
  var GiveawayTitleInfo = $('#GiveawayTitle').val();
  var ExtraColumnInfo = $('#ExtraColumns').val();
  var ExtraColumnInfoExcel = ExtraColumnInfo.replace(/\|/g, "\t");
  if (GiveawayTitleInfo != "")
  {
    var GALink = '[' + GiveawayTitleInfo + '](https://www.steamgifts.com/giveaway/' + fnJustSlug + '/)';
  }
  else
  {
    var GALink = 'https://www.steamgifts.com/giveaway/' + fnJustSlug + '/';
  }
  var SGTable = $('#SGTable');
  SGTable.val(SGTable.val() + '**[' + fnGameName + '](' + fnSteamLink + ')** | ' + GALink + ExtraColumnInfo + '\n');
  var ExcelTable = $('#ExcelTable');
  ExcelTable.val(ExcelTable.val() + fnGameName + '\t' + fnSteamLink + '\thttps://www.steamgifts.com/giveaway/' + fnJustSlug + '/' + ExtraColumnInfoExcel + '\n');
}
