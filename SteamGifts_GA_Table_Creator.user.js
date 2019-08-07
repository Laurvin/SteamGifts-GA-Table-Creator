// ==UserScript==
// @name SteamGifts Giveaways Table/Chart Creator
// @namespace SteamGifts GA Table Creator
// @author Laurvin
// @description Creates a table of all giveaways you've created with links to the Steam product page and the GA page. RaChart compatible.
// @version 1.3
// @icon http://i.imgur.com/XYzKXzK.png
// @downloadURL https://github.com/Laurvin/SteamGifts-GA-Table-Creator/raw/master/SteamGifts_GA_Table_Creator.user.js
// @include http://www.steamgifts.com/giveaways/created*
// @include https://www.steamgifts.com/giveaways/created*
// @grant GM_xmlhttpRequest
// @require http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require https://raw.github.com/dinbror/bpopup/master/jquery.bpopup.min.js
// @run-at document-idle
// ==/UserScript==

var month = new Array();
month[0] = "January";
month[1] = "February";
month[2] = "March";
month[3] = "April";
month[4] = "May";
month[5] = "June";
month[6] = "July";
month[7] = "August";
month[8] = "September";
month[9] = "October";
month[10] = "November";
month[11] = "December";

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
  $('.sidebar').append('<h3 class="sidebar__heading">SteamGifts GA Table Creator (<a style="color:#4B72D4;" target="_blank" href="https://www.steamgifts.com/discussion/dE8ro/">info</a>)</h3>');
  $('.sidebar').append('<button class="sidebar__action-button" id="AddCheckboxes" title="This will add checkboxes to all giveaways so you can select which giveaways are to show up on the tables to be created. If you do not add checkboxes then all giveaways on the page will be selected.">Add Checkboxes</button><div id="BoxingArena"></div>');
  $('#AddCheckboxes').click(AddCheckboxes); 
  $('.sidebar').append('<p><br /><input id="GiveawayTitle" style="width:150px;" type="text" placeholder="Giveaway Title" title="Any text here will be displayed as the name of the link to the giveaways. If this is empty then we display the link. So if you enter the word Giveaway then all links will be called this in the column. This only works for the SG Table.&#013;&#013;This field now also supports the same variables as the Extra Columns field."></input>&nbsp;<input id="GiveawayLevel" style="width:50px; float:right;" type="text" placeholder="Level" title="Enter the level of the giveaways here, if needed. It will be automatically used on the thread tables. If you want to add it to the main GS Table then add a column called %LVL% to the Extra Columns field."></input></p>');
  $('.sidebar').append('<p><br /><input id="ExtraColumns" type="text" placeholder="Extra Columns (|Col 1|Col 2)" title="You can add any extra columns you want using this but only for the SG and Excel Tables. Separate the columns with | like normal for SteamGifts formatting. Start with a | and do not add spaces around the | if you want to use it for the Excel Table. The columns names entered here will be repeated for every row in the table.&#013;&#013;There are three special variables: if a column name is %ED% the rows for that column will be filled with the end date for the giveaway, %CN% will put your user name in the rows for that column, and %LVL% will show the level you entered into the Level field."></input><br /><br /></p>');
  $('.sidebar').append('<p><input title="If checked giveaways that have ended won\'t be included in the tables." style="width:auto; cursor:pointer; vertical-align:middle;" id="SkipEnded" type="checkbox" name="SkipEnded" value="1" checked="checked"></input> <label title="If checked giveaways that have ended won\'t be included in the tables." style="cursor:pointer;" for="SkipEnded">&nbsp;Don\'t include ended Giveaways</label><br /><br /></p>');
  $('.sidebar').append('<button class="sidebar__action-button" id="CreateTables" title="When clicked this will create the tables for you, using any data supplied in the input boxes above and if checkboxes have been added then only for those checkboxes that have been selected.">Create Giveaways Tables</button>');
  $('#CreateTables').click(TraverseGAs);
}

function AddCheckboxes()
{
  var i = 1;
  $('.table__row-inner-wrap').each(function ()
	{
    var InputExists = $(this).find("input:checkbox");
    if (InputExists.length < 1) $(this).prepend('<input style="width:auto; cursor:pointer;" id="check'+i+'" class="checkie" type="checkbox" name="check'+i+'" value="1"></input><label style="line-height:34px; cursor:pointer;" for="check'+i+'">&nbsp;Select</label>');
    i++;
  });
  if($("#CheckThemAll").length == 0)
  {
    $('#BoxingArena').append('<p><span id="CheckThemAll" class="is-clickable table__column__secondary-link">Check All</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="CheckNoneOfEm" class="is-clickable table__column__secondary-link">Check None</span></p>');
    $('#CheckThemAll').click(CheckThemAll);
    $('#CheckNoneOfEm').click(CheckNoneOfEm);
  }
}

function TraverseGAs()
{
  $('#WorkingDiv').remove(); // Removing previous results.
  $('.sidebar').append('<div id="WorkingDiv"></div>');
  $('#WorkingDiv').append('<div id="ResStor"></div>');
  $('#WorkingDiv').append('<h3 class="sidebar__heading">Created Tables</h3><ul id="CreatedTables" class="sidebar__navigation"></ul>');
  
  var Tables = ['SG Table', 'Excel Table', 'Giveaways for peace Rows', 'Positive thread! Rows', 'You\'re Not Alone #3 Rows'];
  var TableDetails = ['This is a standard SG Table for use on the forums and it can be extended using the input boxes.', 'This table is tab separated, ready to be pasted into Excel or other spreadsheet programs.', 'This is formatted for Giveaways for peace but you will need to enter the level of the giveaways into the Level field.', 'This is formatted for Positive thread! but you will need to enter the level of the giveaways into the Level field.', 'This is formatted for You\'re Not Alone #3 but you will need to enter the level of the giveaways into the Level field.'];
 
  $.each(Tables, function (index, item)
	{
    $('.popup--Table'+index).remove(); // Removing previous results.
    $('#WorkingDiv').append('<div class="popup popup--Table'+index+'"><p class="popup__heading" style="color:black;"><strong>'+item+'</strong></p><p class="popup__keys__description">'+TableDetails[index]+'<br /><br /></p><p style="display:grid;"><button id="CopyTable'+index+'" class="sidebar__action-button CopyButton">Copy Table to Clipboard</button></p><textarea id="Table'+index+'" style="height:400px; max-height: 400px; width:500px; overflow-wrap:break-word; resize:both;"></textarea><p class="popup__actions"><br /><span class="b-close">Close</span></p></div>');
    $('#CopyTable'+index).click(function() { CopyIt('#Table'+index); });
    $('#CreatedTables').append('<li class="sidebar__navigation__item" title="'+TableDetails[index]+'"><span style="cursor:pointer;" data-popup="popup--Table'+index+'" class="sidebar__navigation__item__link trigger-popup"><div class="sidebar__navigation__item__name">'+item+'</div><div class="sidebar__navigation__item__underline"></div></span></li>');
  });
 
  $(".trigger-popup").click(function()
  {
    $("." + $(this).attr("data-popup")).bPopup(
    {
      opacity: .50,
      fadeSpeed: 200,
      followSpeed: 500,
      modalColor: "#3c424d",
      amsl: [0]
    })
  }) 
  
  var curdate = new Date();
  var curtimestamp = curdate.getTime();
  
  var CreatorName = $('.nav__avatar-outer-wrap').attr("href");
  CreatorName = CreatorName.substring(CreatorName.lastIndexOf('/') + 1);
  
  // Adding Table headers to SG and Excel Table.
  var ExtraColumnInfo = $('#ExtraColumns').val();
  ExtraColumnInfo = ExtraColumnInfo.replace('%CN%', 'User').replace('%ED%', 'End Date').replace('%LVL%', 'Level');

  var Headers = 'Steam|Giveaway' + ExtraColumnInfo;
  var NumberOfAligners = (Headers.match(/\|/g) || []).length;
  var Aligners = Array(NumberOfAligners+2).join(":-|");
  Aligners = Aligners.slice(0, -1);
  var SGTable = $('#Table0');
  SGTable.val(SGTable.val() + Headers + '\n');
  SGTable.val(SGTable.val() + Aligners + '\n');
  var ExcelTable = $('#Table1');
  ExcelTable.val(ExcelTable.val() + 'Game\t' + Headers.replace(/\|/g, "\t") + '\n');

  $('.table__row-inner-wrap').each(function ()
  {
    var InputExists = $(this).find("input:checkbox");
    var InputChecked = $(this).find("input:checked");
    if (InputExists.length < 1 || InputChecked.length > 0) // Run if checkboxes are not present or if checked when they do exist.
    {
      var Stampie = $(this).find('span span').data('timestamp')*1000;
      var SkipEnded = $("#SkipEnded:checked").length;
      if (SkipEnded == 0 || curtimestamp < Stampie) // Skip giveaways that have ended if checkbox for it was checked.
      {
        var dt = new Date(Stampie);
        var EndDate = month[dt.getMonth()] + ' ' + dt.getDate();

        var GAlink = $(this).find('a.table_image_thumbnail').attr('href');
        if (typeof GAlink === 'undefined') // Certain packs, etc. have no background image so we search on Steam for the store url.
        {
          GAlink = $(this).find('a.table_image_thumbnail_missing').attr('href');
          var NoSteamLink = 1;
        }
        var GALinkMinusName = GAlink.substring(0, GAlink.lastIndexOf('/')); // Removes game name from link.
        var GAJustSlug = GALinkMinusName.substring(GALinkMinusName.lastIndexOf('/') + 1); // Saves just the slug.
        var GameName = $(this).find('a.table__column__heading').html();
        var IsThereESGST = GameName.indexOf('<a class="esgst'); // Removing extra info added by ESGST.
        if (IsThereESGST > 0) GameName = GameName.substr(0,IsThereESGST-1).trim();
        if (NoSteamLink == 1)
        {
          GetSteamInfo(GameName, GAJustSlug, EndDate);
        }
        else 
        {
          var ImgUrl = $(this).find('a.table_image_thumbnail').css('background-image');
          var SubstrStart = ImgUrl.indexOf('akamaihd.net/steam/') + 18;
          var SubstrEnd = ImgUrl.lastIndexOf('/') + 1;
          var SteamUrlPart = ImgUrl.substring(SubstrStart, SubstrEnd);
          SteamUrlPart = SteamUrlPart.replace("apps", "app"); // No idea why they added the S in the urls for the images.
          SteamUrlPart = SteamUrlPart.replace("subs", "sub");
          var FullSteamLink = 'http://store.steampowered.com' + SteamUrlPart;
          CreateTableRows(GameName, GAJustSlug, FullSteamLink, EndDate, CreatorName);
        }
      }
    }
  });
}
function GetSteamInfo(fnGameName, fnJustSlug, fnEndDate, fnCreatorName)
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
            CreateTableRows(fnGameName, fnJustSlug, fnSteamLink, fnEndDate, fnCreatorName);
            $('#SGid' + fnJustSlug).remove(); // No longer needed so removing to keep the page light.
          }
        });
      } 
      else
      {
        var fnSteamLink = FullSteamLink.substring(0, FullSteamLink.lastIndexOf('/') + 1); // Removes ? and everything after.
        CreateTableRows(fnGameName, fnJustSlug, fnSteamLink, fnEndDate, fnCreatorName);
        $('#id' + fnJustSlug).remove(); // No longer needed so removing to keep the page light.
      }
    },
    onerror: function (response)
    {
      var fnSteamLink = 'ERROR OCCURED TRYING TO REACH STEAM';
      CreateTableRows(fnGameName, fnJustSlug, fnSteamLink, fnEndDate, fnCreatorName);
    },
    ontimeout: function (response)
    {
      var fnSteamLink = 'TIMEOUT GETTING DATA FROM STEAM';
      CreateTableRows(fnGameName, fnJustSlug, fnSteamLink, fnEndDate, fnCreatorName);
    }
  });
}
function CreateTableRows(fnGameName, fnJustSlug, fnSteamLink, fnEndDate, fnCreatorName)
{
  var GiveawayLevel = $('#GiveawayLevel').val();
  var GiveawayTitleInfo = $('#GiveawayTitle').val();
  GiveawayTitleInfo = GiveawayTitleInfo.replace('%CN%', fnCreatorName).replace('%ED%', fnEndDate).replace('%LVL%', GiveawayLevel);
  var ExtraColumnInfo = $('#ExtraColumns').val();
  ExtraColumnInfo = ExtraColumnInfo.replace('%CN%', fnCreatorName).replace('%ED%', fnEndDate).replace('%LVL%', GiveawayLevel);
  
  var ExtraColumnInfoExcel = ExtraColumnInfo.replace(/\|/g, "\t");
  if (GiveawayTitleInfo != "")
  {
    var GALink = '[' + GiveawayTitleInfo + '](https://www.steamgifts.com/giveaway/' + fnJustSlug + '/)';
  }
  else
  {
    var GALink = 'https://www.steamgifts.com/giveaway/' + fnJustSlug + '/';
  }
  var SGTable = $('#Table0');
  SGTable.val(SGTable.val() + '**[' + fnGameName + '](' + fnSteamLink + ')** | ' + GALink + ExtraColumnInfo + '\n');
  var ExcelTable = $('#Table1');
  ExcelTable.val(ExcelTable.val() + fnGameName + '\t' + fnSteamLink + '\thttps://www.steamgifts.com/giveaway/' + fnJustSlug + '/' + ExtraColumnInfoExcel + '\n');
  var GFPTable = $('#Table2');
  GFPTable.val(GFPTable.val() + '`[' + fnGameName + '](' + GALink + ') | ' + fnCreatorName + ' | Level ' + GiveawayLevel + ' | ' + fnEndDate + ' | No`\n');
  var PTTable = $('#Table3');
  PTTable.val(PTTable.val() + '`[' + fnGameName + '](' + GALink + ') | ' + fnCreatorName + ' | Level ' + GiveawayLevel + '`\n');
  var YNATable = $('#Table4');
  YNATable.val(YNATable.val() + '`[' + fnGameName + '](' + GALink + ') Lv' + GiveawayLevel + ' | ' + fnCreatorName + ' | ' + fnEndDate + '`\n');
}

function CopyIt(id)
{
    $(id).focus();
    $(id).select();
    document.execCommand('copy');
}

function CheckThemAll()
{
  $('.table__row-inner-wrap').each(function ()
  {
    console.log($(this).find('.checkie'));
    $(this).find('.checkie').prop('checked', true);
  });
}

function CheckNoneOfEm()
{
  $('.table__row-inner-wrap').each(function ()
  {
    console.log($(this).find('.checkie'));
    $(this).find('.checkie').prop('checked', false);
  });
}
