// This code, written by Angelo Basteris - committed 8th May 2020, contains code from JS-CSS-Poker (thanks to the developer)
// An obfuscated version of this file runs on https://friendspoker.club

"use strict";

var START_DATE;
var NUM_ROUNDS;
var STOP_AUTOPLAY = 0;
var RUN_EM = 0;
var STARTING_BANKROLL = 5000;
var SMALL_BLIND;
var BIG_BLIND=50;
var BG_HILITE = 'gold';           // "#EFEF30",
var global_speed = 1;
var HUMAN_WINS_AGAIN;
var HUMAN_GOES_ALL_IN;
var cards = new Array(52);
var players;
var board, deck_index, button_index;
var current_bettor_index, current_bet_amount, current_min_raise;
var api=null;
var whoami=localStorage.whoami;
var handStatus="running";
var t0=window.performance.now()
var replies=0;
var server="";
var gameStarting=true;
var n_players;
function leave_pseudo_alert () 
{
	gui_write_modal_box("");
}
function my_pseudo_alert (text) 
{
	var html = "<html><body topmargin=2 bottommargin=0 bgcolor=" +
             BG_HILITE + " onload='document.f.y.focus();'>" +
             "<font size=+2>" + text +
             "</font><form name=f><input name=y type=button value='  OK  ' " +
             "onclick='parent.leave_pseudo_alert()'></form></body></html>";
	gui_write_modal_box(html);
}
// The player constructor
function player (name, bankroll, carda, cardb, status, total_bet,subtotal_bet,number,hilite,cardsvisible,jitsi_id) 
{
	this.name = name;
	this.bankroll = bankroll;
	this.carda = carda;
	this.cardb = cardb;
	this.status = status;
	this.total_bet = total_bet;
	this.subtotal_bet = subtotal_bet;
	this.number=number;		//Following attributes were added to the original game
	this.hilite=0;
	this.cardsvisible=false;
	this.jitsi_id=jitsi_id;
}
//Local function, has a match on client side
function showCards()
{
	players[0].cardsvisible=true;
	write_player(0, players[0].hilite, 1);
}
function countPlayers()
{
	return n_players;
}

// See stackoverflow.com/questions/16427636/check-if-localstorage-is-available
function has_local_storage () 
{
	try {
		var storage = window['localStorage'];
		var x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
		}
  catch (e) 
  {return false;}
}

function init () 
{
	if (!has_local_storage()) {
		my_pseudo_alert("Your browser do not support localStorage - try a more modern browser like Firefox");
		return;
		}
	gui_hide_poker_table();
	gui_hide_log_window();
	gui_hide_setup_option_buttons();
	gui_hide_fold_call_click();
	gui_hide_guick_raise();
	gui_hide_dealer_button();
	gui_hide_game_response();
	gui_initialize_theme_mode();
	make_deck();
	new_game();
	if(localStorage.players!=undefined)// If this is resuming an existing game, saved in localStorage
		{
			document.getElementById("start-button").innerHTML="Restart"
			document.getElementById("speed-button").style.display="none";
			document.getElementById("mode-button").style.display="none";
		}
}

function make_deck () {
	var i;
	var j = 0;
	for (i = 2; i < 15; i++) {
		cards[j++] = "h" + i;
		cards[j++] = "d" + i;
		cards[j++] = "c" + i;
		cards[j++] = "s" + i;
	}
}

function handle_how_many_reply () 
{
	//sendAllParticipants("Areyouplaying");
	var opponents=Object.keys(api._participants).length-1;		//how many people are in the room - the host
	//opponents=setTimeout(3000,countPlayers);//=Object.keys(api._participants).length-1;
	sendAllParticipants("Whoareyou")
	/*var t0=window.performance.now()
	while((window.performance.now()-t0)<3000)
		console.log("waiting")*/
	if(localStorage.players!=undefined)	//resuming a game
	{
		gameStarting=false;
		players=JSON.parse(localStorage.players);
		opponents=players.length-1;
	}
	localStorage.setItem("whoami",0)
	//wait_for_replies();
	//  sendAll("Game starting")
	gui_write_modal_box("");
	write_settings_frame();
	new_game_continues(opponents);
	gui_initialize_css();         // Load background images
	gui_show_game_response();
	document.getElementById("mode-button").style.display="block";
}
function initialize_game () 
{
	gui_hide_poker_table();
	gui_hide_dealer_button();
	gui_hide_fold_call_click();
	gui_show_poker_table();
}
function clear_player_cards (count) 
{
	count = count + 1; // Count that human too
	for (var pl = 0; pl < count; ++pl) {
		gui_set_player_cards("", "", pl);
		gui_set_player_name("", pl);
		gui_set_bet("", pl);
		gui_set_bankroll("", pl);
	}
}
function new_game () 
{
  START_DATE = new Date();
  NUM_ROUNDS = 0;
  initialize_game();
  start_game();
}
function new_game_continues (req_no_opponents) 
{
  //alert("About to create players")
	if(localStorage.players==undefined)
	{
		players = new Array(req_no_opponents + 1);
		var player_name = getLocalStorage("playername");
		players[0] = new player(player_name, 0, "", "", "", 0, 0,0,0,api._myUserID);
		var i;
		for (i = 1; i < players.length;  i++) { //Object.keys(api._participants).length;
			players[i] = new player(i, 0, "", "", "", 0, 0,i,0,0);}
    //players[i] = new player(Object.keys(api._participants)[i], 0, "", "", "", 0, 0);}
		clear_player_cards(9);
		reset_player_statuses(0);
		clear_bets();
		for (i = 0; i < players.length; i++) 
			players[i].bankroll = STARTING_BANKROLL;
	}
	players[0].jitsi_id=api._myUserID;
	sendAll("Game starting");
	//sendAllParticipants("Whoareyou")
	clear_player_cards(9);
	//reset_player_statuses(0);
	clear_bets();
	button_index = Math.floor(Math.random() * players.length);
	new_round();
}
function number_of_active_players () 
{
	var num_playing = 0;
	var i;
	for (i = 0; i < players.length; i++) 
	{if (has_money(i)) {
			num_playing += 1;}}
  return num_playing;
}
function new_round () 
{
	RUN_EM = 0;
	NUM_ROUNDS++;
	// Clear buttons
	gui_hide_fold_call_click();
	var num_playing = number_of_active_players();
	/*if (num_playing < 2) {
    gui_setup_fold_call_click("Start a new game",
                              0,
                              new_game,
                              new_game);
    return;*/
  //}
  //HUMAN_GOES_ALL_IN = 0;
	reset_player_statuses(1);
	clear_bets();
	clear_pot();
	current_min_raise = 0;
	collect_cards();
	button_index = get_next_player_position(button_index, 1);
	var i;
	for (i = 0; i < players.length; i++) {
		write_player(i, 0, 0);
	}
	for (i = 0; i < board.length; i++) {
		if (i > 4) {        // board.length != 5
		continue;
    }
    board[i] = "";
    gui_lay_board_card(i, board[i]);     // Clear the board
	}
  /*for (i = 0; i < 3; i++) {
    board[i] = "";
    gui_burn_board_card(i, board[i]);
  }*/
	var message = "<tr><td><font size=+2><b>New round</b></font>";
	gui_write_game_response_server(message);
	//if(!gameStarting)
		//check_statuses();
	gui_hide_guick_raise();
	shuffle();
	clearTable();
  /*for(i=0;i<players.length;i++)
	  if(!(Object.keys(api._participants).includes(players[i].jitsi_id)))
		  players[i].status="BUST"*/
	blinds_and_deal();
}
function collect_cards () 
{
	board = new Array(6);
	for (var i = 0; i < players.length; i++) {
		players[i].carda = "";
		players[i].cardb = "";
  }
}
function new_shuffle () 
{
	function get_random_int (max) {return Math.floor(Math.random() * max);}
	var len = cards.length;
	for (var i = 0; i < len; ++i) {
		var j = i + get_random_int(len - i);
		var tmp = cards[i];
		cards[i] = cards[j];
		cards[j] = tmp;
		}
}
function check_statuses()
{
	players[0].jitsi_id=api._myUserID;
	for(var i=0;i<Object.keys(api._participants).length;i++)
	{
		var isLinked=false;
		for(var j=1;j<players.length;j++)	
				if(players[j].jitsi_id==Object.keys(api._participants)[i])
					isLinked=true;
		if (!isLinked)
			api.executeCommand("sendEndpointTextMessage",Object.keys(api._participants)[i],"Whoareyou")
	}
	////delay here?!
	for(var i=1;i<players.length;i++)
	{
		if (!(Object.keys(api._participants).includes(players[i].jitsi_id)))
		{
			if(players[i].status!="BUST")
			{
				players[i].status="SITOUT";
				players[i].jitsi_id="";
			}
		}
		else if(players[i].status=="SITOUT")
			players[i].status="";
	}
}
function shuffle () 
{
  new_shuffle();
  deck_index = 0;
}

function blinds_and_deal () 
{
 handStatus="running";
  SMALL_BLIND = BIG_BLIND/2;
  var small_blind = get_next_player_position(button_index, 1);
  the_bet_function(small_blind, SMALL_BLIND);
  write_player(small_blind, 0, 0);
  var big_blind = get_next_player_position(small_blind, 1);
  set_big_blind(BIG_BLIND);
  the_bet_function(big_blind, BIG_BLIND);
  write_player(big_blind, 0, 0);
  players[big_blind].status = "OPTION";
  current_bettor_index = get_next_player_position(big_blind, 1);
  deal_and_write_a();
}
function unroll_player (starting_player, player_pos, final_call) 
{
	var next_player = get_next_player_position(player_pos, 1);
	write_player(player_pos, 0, 0);
	if (starting_player == next_player) {
		setTimeout(final_call, 550 * global_speed);
	} else {
		setTimeout(unroll_player, 550 * global_speed,
               starting_player, next_player, final_call);
  }
}
function deal_and_write_a () 
{
	var current_player;
	var start_player;
	start_player = current_player = get_next_player_position(button_index, 1);
	// Deal cards to players still active
	do {
		players[current_player].carda = cards[deck_index++];
		giveCard("A",current_player,players[current_player].carda); 	
		current_player = get_next_player_position(current_player, 1);
	} while (current_player != start_player);
	// and now show the cards
	current_player = get_next_player_position(button_index, 1);
	unroll_player(current_player, current_player, deal_and_write_b);
}
// Make a small delay before starting the bets
function delay_for_main () {setTimeout(main, 1000);}

function deal_and_write_b () 
{
	var current_player = button_index;
	for (var i = 0; i < players.length; i++) {
		current_player = get_next_player_position(current_player, 1);
		if (players[current_player].cardb) {break;}
		players[current_player].cardb = cards[deck_index++];
		giveCard("B",current_player,players[current_player].cardb); 
	}
	current_player = get_next_player_position(button_index, 1);
	unroll_player(current_player, current_player, delay_for_main);
}
function go_to_betting () 
{
	if (get_num_betting() > 1) {
		setTimeout(main, 1000 * global_speed);
	} else {
		setTimeout(ready_for_next_card, 1000 * global_speed);
  }
}
function unroll_table (last_pos, current_pos, final_call) 
{
	sendAll("LayCard-"+current_pos+"-"+board[current_pos])
	gui_lay_board_card(current_pos, board[current_pos]);
	if (current_pos == last_pos) {setTimeout(final_call, 150 * global_speed);} 
	else {setTimeout(unroll_table, 150 * global_speed, last_pos, current_pos + 1, final_call);}
}
function deal_flop () 
{
	var burn = cards[deck_index++];
	gui_burn_board_card(0, burn);
	var message = "<tr><td><font size=+2><b>Dealing flop</b></font>";
	gui_write_game_response_server(message);
	for (var i = 0; i < 3; i++) {board[i] = cards[deck_index++];}
	// Place 3 first cards
	setTimeout(unroll_table, 1000, /*last_pos*/2, /*start_pos*/0, go_to_betting);
}
function deal_fourth () 
{
	var burn = cards[deck_index++];
	gui_burn_board_card(1, burn);
	var message = "<tr><td><font size=+2><b>Dealing turn</b></font>";
	gui_write_game_response_server(message);
	board[3] = cards[deck_index++];
	// Place 4th card
	setTimeout(unroll_table, 1000, /*last_pos*/3, /*start_pos*/3, go_to_betting);
}
function deal_fifth () 
{
	var burn = cards[deck_index++];
	gui_burn_board_card(2, burn);
	var message = "<tr><td><font size=+2><b>Dealing river</b></font>";
	gui_write_game_response_server(message);
	board[4] = cards[deck_index++];
	// Place 5th card
	setTimeout(unroll_table, 1000, /*last_pos*/4, /*start_pos*/4, go_to_betting);
}

function main () 
{
	// gui_hide_guick_raise();
	var increment_bettor_index = 0;
	if (players[current_bettor_index].status == "BUST" ||
		players[current_bettor_index].status == "FOLD"||
		players[current_bettor_index].status == "SITOUT") 
		{increment_bettor_index = 1;}
	else if (!has_money(current_bettor_index)) 
	{
		players[current_bettor_index].status = "CALL";
		increment_bettor_index = 1;
	} else if (players[current_bettor_index].status == "CALL" &&
             players[current_bettor_index].subtotal_bet == current_bet_amount) 
	{increment_bettor_index = 1;} 
	else 
	{
		players[current_bettor_index].status = "";
		if ((current_bettor_index == 0) ||(handStatus=="complete"))
		{
			document.getElementById("action-options").style="left:310px";
			document.getElementById("quick-raises").style="left:310px";
			document.getElementById("action-options").style="display:block";
			var x = document.getElementById("beep"); 
			x.play();
		}else
		{    
			document.getElementById("action-options").style="left:100px;display:none";
			document.getElementById("quick-raises").style="left:100px;display:none";
		}
	var to_call = current_bet_amount - players[current_bettor_index].subtotal_bet;
    var call_button_text = "<u>C</u>all - <b>"+to_call+"</b>";
    var fold_button_text = "<u>F</u>old";
    if (to_call > players[current_bettor_index].bankroll) {
        to_call = players[current_bettor_index].bankroll; }
    var that_is_not_the_key_you_are_looking_for;
    if (to_call == 0) 
	{
        call_button_text = "<u>C</u>heck";
        fold_button_text = "<u>F</u>old";
        that_is_not_the_key_you_are_looking_for = function (key) {
          if (key == 67) {         // Check
          human_call(current_bettor_index);}
		  else if ((key == 70)&&(get_num_betting()>1)) {  // Fold
            human_fold(current_bettor_index);}
			else {return true;           // Not my business
			}
          return false;
        };
      } 
	  else {
        that_is_not_the_key_you_are_looking_for = function (key) {
          if (key == 67) {         // Call
            human_call(current_bettor_index);}
			else if (key == 70) {  // Fold
				human_fold(current_bettor_index);}
				else { return true;           // Not my business
          }
          return false;
        };
      }
      // Fix the shortcut keys - structured and simple
      // Called through a key event
	var ret_function = function (key_event) {actual_function(key_event.keyCode, key_event);}

	// Called both by a key press and click on button.
    // Why? Because we want to disable the shortcut keys when done
    var actual_function = function (key, key_event) {
        if (that_is_not_the_key_you_are_looking_for(key)) {
          return;}
    gui_disable_shortcut_keys(ret_function);
    if (key_event != null) {
          key_event.preventDefault();}
      };
	// And now set up so the key click also go to 'actual_function'
    var do_fold = function () {
    actual_function(70, null);};
    var do_call = function () {
        actual_function(67, null);
      };
     // Trigger the shortcut keys
    gui_enable_shortcut_keys(ret_function);
	if(get_num_betting()==1)
		fold_button_text=0;
      // And enable the buttons
    gui_setup_fold_call_click(fold_button_text,
                                call_button_text,
                                do_fold,
                                do_call);

     var quick_values = new Array(6);
      //if (to_call < players[current_bettor_index].bankroll) {
      var quick_start = BIG_BLIND;
      //}
      var i;
      for (i = 0; i < 5; i++) {
        if (quick_start + BIG_BLIND * i < players[current_bettor_index].bankroll) {
          quick_values[i + 1] = quick_start + BIG_BLIND * i;
        }
      }
      var bet_or_raise = "Bet";
      if (to_call > 0) {
        bet_or_raise = "Raise";
      }
      var quick_bets = "<b>Quick " + bet_or_raise + "s</b><br>";
      for (i = 0; i < 6; i++) {
        if (quick_values[i]) {
          quick_bets += "<button onclick='javascript:parent.handle_human_bet(" +
                        quick_values[i] + ")'>" + quick_values[i] + "</a>" +
                        "&nbsp;&nbsp;&nbsp;";
        }
      }
      /*var quick_bets = "<b>Quick " + bet_or_raise + "s</b><br>";
      for (i = 0; i < 6; i++) {
        if (quick_values[i]) {
          quick_bets += "<a href='javascript:parent.handle_human_bet(" +
                        quick_values[i] + ")'>" + quick_values[i] + "</a>" +
                        "&nbsp;&nbsp;&nbsp;";
        }
      }*/
      quick_bets += "<button onclick='javascript:parent.handle_human_bet(" +
                    players[current_bettor_index].bankroll + ")'>All In!</a>";
      var html9 = "<td><table align=center><tr><td align=center>";
      var html10 = quick_bets +
                   "</td></tr></table></td></tr></table><input id='number' type='number' value='"+BIG_BLIND+"'><input name=y type=button value='BET ' onclick='javascript:parent.handle_custom_human_bet()'></body></html>";
      gui_write_guick_raise(html9 + html10);

      var hi_lite_color = gui_get_theme_mode_highlite_color();
      var message = "<tr><td><font size=+2><b>Current raise: " +
                    current_bet_amount +
                    "</b><br> You need <font color=" + hi_lite_color +
                    " size=+3>" + to_call +
                    "</font> more to call.</font></td></tr>";
	 var interfaceData={"to_call":to_call,"values":quick_values,"pot_size":get_pot_size(),"current_bet_amount":current_bet_amount}
	 sendTo(current_bettor_index,JSON.stringify(interfaceData));
      gui_write_game_response_server(message);
      write_player(current_bettor_index, 1, 0);
	  //alert(current_bettor_index)
	  if(!(Object.keys(api._participants).includes(players[current_bettor_index].jitsi_id)))
			human_fold(current_bettor_index);
	  sendAll("Turn-"+current_bettor_index);
      return;
	}
	var can_break = true;
	for (var j = 0; j < players.length; j++) {
		var s = players[j].status;
		if (s == "OPTION") {
		can_break = false;
		break;
		}
		if (s != "BUST" && s != "FOLD" && s!="SITOUT") {
			if (has_money(j) && players[j].subtotal_bet < current_bet_amount) {
				can_break = false;
				break;
			}
		}
	}
	if (increment_bettor_index) {current_bettor_index = get_next_player_position(current_bettor_index, 1);}
	if (can_break) {
		setTimeout(ready_for_next_card, 999 * global_speed);
	} else {
		setTimeout(main, 999 * global_speed);
	}
}
function handle_custom_human_bet(){handle_human_bet(parseInt(document.getElementById("number").value))};

var global_pot_remainder = 0;
var best_hand_players;
var playersOld,playersNew;

function handle_end_of_round () 
{
	playersOld=players;
	gameStarting=false;
	handStatus="complete";
	var players_old_copy=players;
	var candidates = new Array(players.length);
	var allocations = new Array(players.length);
	var winning_hands = new Array(players.length);
	var my_total_bets_per_player = new Array(players.length);
	// Clear the ones that folded or are busted
	var i;
	for(i=0;i<players.length;i++)
		players[i].cardsvisible=false;
	var still_active_candidates = 0;
	for (i = 0; i < candidates.length; i++) {
		allocations[i] = 0;
		my_total_bets_per_player[i] = players[i].total_bet;
    if (players[i].status != "FOLD" && players[i].status != "BUST" && players[i].status != "SITOUT" ) {
      candidates[i] = players[i];
      still_active_candidates += 1;
	}
	}
	var my_total_pot_size = get_pot_size();
	var my_best_hand_name = "";
	var current_pot_to_split = 0;
	var pot_remainder = 0;
	if (global_pot_remainder) {
		gui_log_to_history("transferring global pot remainder " + global_pot_remainder);
		pot_remainder = global_pot_remainder;
		my_total_pot_size += global_pot_remainder;
		global_pot_remainder = 0;
	}
	while (my_total_pot_size > (pot_remainder + 0.9) && still_active_candidates) {
//    gui_log_to_history("splitting pot with pot " + my_total_pot_size +
//                       " and remainder " + pot_remainder +
//                       " on " + still_active_candidates + " candidates" );

    // The first round all who not folded or busted are candidates
    // If that/ose winner(s) cannot get all of the pot then we try
    // with the remaining players until the pot is emptied
		var winners = get_winners(candidates);
		if (!best_hand_players) {
			best_hand_players = winners;
		}
		if (!winners) {
//      gui_log_to_history("no winners");
			my_pseudo_alert("No winners for the pot ");
			pot_remainder = my_total_pot_size;
			my_total_pot_size = 0;
			break;
		}
    // Get the lowest winner bet, e.g. an all-in
		var lowest_winner_bet = my_total_pot_size * 2;
		var num_winners = 0;
		for (i = 0; i < winners.length; i++) {
			if (!winners[i]) { // Only the winners bets
				continue;
				}
			if (!my_best_hand_name) {
				my_best_hand_name = winners[i]["hand_name"];
			}
			num_winners++;
			if (my_total_bets_per_player[i] < lowest_winner_bet) {
				lowest_winner_bet = my_total_bets_per_player[i];
			}
		}
		// Compose the pot
		// If your bet was less than (a fold) or equal to the lowest winner bet:
		//    then add it to the current pot
		// If your bet was greater than lowest:
		//    then just take the 'lowest_winner_bet' to the pot
		// Take in any fraction from a previous split
		//    if (pot_remainder) {
		//      gui_log_to_history("increasing current pot with remainder " + pot_remainder);
		//    }
		current_pot_to_split = pot_remainder;
		pot_remainder = 0;
		for (i = 0; i < players.length; i++) {
			if (lowest_winner_bet >= my_total_bets_per_player[i]) {
				current_pot_to_split += my_total_bets_per_player[i];
				my_total_bets_per_player[i] = 0;
			} else {
			current_pot_to_split += lowest_winner_bet;
			my_total_bets_per_player[i] -= lowest_winner_bet;
			}
		}
		// Divide the pot - in even integrals
		//    gui_log_to_history("Divide the pot " + current_pot_to_split +
		//                       " on " + num_winners + " winner(s)");
		var share = Math.floor(current_pot_to_split / num_winners);
		// and save any remainders to next round
		pot_remainder = current_pot_to_split - share * num_winners;
		//    gui_log_to_history("share " + share + " remainder " + pot_remainder);
		for (i = 0; i < winners.length; i++) {
			if (my_total_bets_per_player[i] < 0.01) {
				candidates[i] = null;           // You have got your share
			}
			if (!winners[i]) {                // You should not have any
				continue;
			}
			my_total_pot_size -= share;       // Take from the pot
			allocations[i] += share;          // and give to the winners
			winning_hands[i] = winners[i].hand_name;
		}
		// Iterate until pot size is zero - or no more candidates
		for (i = 0; i < candidates.length; i++) {
			if (candidates[i] == null) {
				continue;
		}
		still_active_candidates += 1
		}
		if (still_active_candidates == 0) {
			pot_remainder = my_total_pot_size;
			//      gui_log_to_history("no more candidates, pot_remainder " + pot_remainder);
		}
		gui_log_to_history("End of iteration");
	} // End of pot distribution
	global_pot_remainder = pot_remainder;
	//  gui_log_to_history("distributed; global_pot_remainder: " +
	//                     global_pot_remainder +
	//                     " pot_remainder: " + pot_remainder);
	var pot_remainder = 0;
	var winner_text = "";
	var human_loses = 0;
	// Distribute the pot - and then do too many things
	for (var i = 0; i < allocations.length; i++) {
		if (allocations[i] > 0) {
			var a_string = "" + allocations[i];
			var dot_index = a_string.indexOf(".");
			if (dot_index > 0) {
				a_string = "" + a_string + "00";
				allocations[i] = a_string.substring(0, dot_index + 3) - 0;
			}
			winner_text += /*winning_hands[i] + " gives " + */allocations[i] +" to " + players[i].name + ". ";
			players[i].bankroll += allocations[i];
	  /*if (best_hand_players[i]) {
        // function write_player(n, hilite, show_cards)
        write_player(i, 2, 1);
      } else {
        write_player(i, 1, 1);
      }*/
		} 
		else {
			if (!has_money(i) && players[i].status != "BUST") {
				players[i].status = "BUST";
				}/*
				if (players[i].status != "FOLD") {
				write_player(i, 0, 1);
				}*/
		}
	}
  // Have a more liberal take on winning
  /*if (allocations[0] > 5) {
    HUMAN_WINS_AGAIN++;
  } else {
    HUMAN_WINS_AGAIN = 0;
  }*/
	var detail = "";
	for (i = 0; i < players.length; i++) {
	if ((players[i].total_bet == 0 && players[i].status == "BUST") ||(players[i].status == "SITOUT")){
      continue;  // Skip busted players
    }
    detail += players[i].name + " bet " + players[i].total_bet + " & got " +allocations[i] + ".\\n";
	}
	detail = " (<a href='javascript:alert(\"" + detail + "\")'>details</a>)";
	/*var quit_text = "Show my cards";
	var quit_func =  showCards;
	var continue_text = "Show winner";
	var continue_func = showWinners;*/
	/* if (players[0].status == "BUST" && !human_loses) {
		continue_text = 0;
		quit_func = function () {
		parent.STOP_AUTOPLAY = 1;
	};
    setTimeout(autoplay_new_round, 1500 + 1100 * global_speed);
  }*/
	var num_playing = number_of_active_players();
	if (num_playing < 2) {
		// Convoluted way of finding the active player and give him the pot
		for (i = 0; i < players.length; i++) {
      // For whosoever hath, to him shall be given
			if (has_money(i)) {
				players[i].bankroll += pot_remainder;
				pot_remainder = 0;
			}
		}
	}
	if (pot_remainder) 
	{
		var local_text = "There is " + pot_remainder + " put into next pot\n";
		detail += local_text;
	}
	var hi_lite_color = gui_get_theme_mode_highlite_color();
	html = "<html><body topmargin=2 bottommargin=0 bgcolor=" + BG_HILITE +
             " onload='document.f.c.focus();'><table><tr><td>" +
             get_pot_size_html() +
             "</td></tr></table><br><p id='results' style='display:block'><font size=+2 color=" + hi_lite_color +
             "><b>Winning: " +
             winner_text + "</b></font>" + detail + "<br></p>";
	//gui_write_game_response_server(html);
	var quit_text = "Show my cards";
	var quit_func =  showCards;
	var continue_text = "Finish hand";
	var continue_func = showWinners;
	gui_setup_fold_call_click(quit_text,continue_text,quit_func,continue_func);
	sendAll("Endofhand");
	var elapsed_milliseconds = ((new Date()) - START_DATE);
	var elapsed_time = makeTimeString(elapsed_milliseconds);
	if (human_loses == 1) {
		var ending = NUM_ROUNDS == 1 ? "1 deal." : NUM_ROUNDS + " deals.";
		my_pseudo_alert("Sorry, you busted " + players[0].name + ".\n\n" +elapsed_time + ", " + ending);
	} else 
	{
    num_playing = number_of_active_players();
    /*if (num_playing < 2) {
      var end_msg = "GAME OVER!";
      var over_ending = NUM_ROUNDS == 1 ? "1 deal." : NUM_ROUNDS + " deals.";
      if (has_money(0)) {
        end_msg += "\n\nYOU WIN " + players[0].name.toUpperCase() + "!!!";
      } else {
        end_msg += "\n\nSorry, you lost.";
      }
      my_pseudo_alert(end_msg + "\n\nThis game lasted " + elapsed_time + ", " +
                      over_ending);
    }*/
	}
	localStorage.setItem("players", JSON.stringify(players));
	playersNew=players;
	players=playersOld;
}
var html="";
function showWinners()
{
	players=playersNew;
	gui_write_game_response_server(html);
	//document.getElementById('results').style.display="block";
	for(var i=0;i<players.length;i++)
	{
		if (best_hand_players[i]) {
        // function write_player(n, hilite, show_cards)
        write_player(i, 2, 0);
      } else {
        write_player(i, 0, 0);
      }
	}
	var continue_text = "New hand";
    var continue_func = new_round;
	gui_setup_fold_call_click(continue_text,0,continue_func,continue_func);
	sendAll("Newhand")
	check_statuses();
}

function ready_for_next_card () 
{
	var num_betting = get_num_betting();
	var i;
	for (i = 0; i < players.length; i++) {
		players[i].total_bet += players[i].subtotal_bet;
	}
	clear_bets();
	if (board[4]) {
		handle_end_of_round();
		return;
	}
	current_min_raise = BIG_BLIND;
	reset_player_statuses(2);
	if (players[button_index].status == "FOLD") {
		players[get_next_player_position(button_index, -1)].status = "OPTION";
	} else {
		players[button_index].status = "OPTION";
	}
	current_bettor_index = get_next_player_position(button_index, 1);
	var show_cards = 0;
	if (!RUN_EM) {
		for (i = 0; i < players.length; i++) { // <-- UNROLL
			if (players[i].status != "BUST" && players[i].status != "FOLD" && players[i].status != "SITOUT") {
				write_player(i, 0, show_cards);}
		}
	}
	if (num_betting < 2) {
		RUN_EM = 1;
	}
	if (!board[0]) {
		deal_flop();
	} else if (!board[3]) {
		deal_fourth();
	} else if (!board[4]) {
		deal_fifth();
	}
}
function the_bet_function (player_index, bet_amount) {
  if (players[player_index].status == "FOLD") {
    return 0;
    // FOLD ;
  } else if (bet_amount >= players[player_index].bankroll) { // ALL IN
    bet_amount = players[player_index].bankroll;

    var old_current_bet = current_bet_amount;

    if (players[player_index].subtotal_bet + bet_amount > current_bet_amount) {
      current_bet_amount = players[player_index].subtotal_bet + bet_amount;
    }

    // current_min_raise should be calculated earlier ? <--
    /*var new_current_min_raise = current_bet_amount - old_current_bet;
    if (new_current_min_raise > current_min_raise) {
      current_min_raise = new_current_min_raise;
    }*/
    players[player_index].status = "CALL";
  } else if (bet_amount + players[player_index].subtotal_bet ==
             current_bet_amount) { // CALL
    players[player_index].status = "CALL";
  } else if (current_bet_amount >
             players[player_index].subtotal_bet + bet_amount) { // 2 SMALL
    // COMMENT OUT TO FIND BUGS
    if (player_index == 0) {
      my_pseudo_alert("The current bet to match is " + current_bet_amount +
                      "\nYou must bet a total of at least " +
                      (current_bet_amount - players[player_index].subtotal_bet) +
                      " or fold.");
    }
    return 0;
  } else if (bet_amount + players[player_index].subtotal_bet >
             current_bet_amount && // RAISE 2 SMALL
             get_pot_size() > 0 &&
             bet_amount + players[player_index].subtotal_bet - current_bet_amount < current_min_raise) {
    // COMMENT OUT TO FIND BUGS
    if (player_index == 0) {
      my_pseudo_alert("Minimum raise is currently " + current_min_raise + ".");
    }
    return 0;
  } else { // RAISE
    players[player_index].status = "CALL";

    var previous_current_bet = current_bet_amount;
    current_bet_amount = players[player_index].subtotal_bet + bet_amount;

   /* if (get_pot_size() > 0) {
      current_min_raise = current_bet_amount - previous_current_bet;
      if (current_min_raise < BIG_BLIND) {
        current_min_raise = BIG_BLIND;
      }
    }*/
  }
  players[player_index].subtotal_bet += bet_amount;
  players[player_index].bankroll -= bet_amount;
  var current_pot_size = get_pot_size();
  gui_write_basic_general_server(current_pot_size);
  return 1;
}

function human_call (player_index=0) {
  // Clear buttons
  gui_hide_fold_call_click();
  players[player_index].status = "CALL";
  write_player(player_index, 0, 0);
  current_bettor_index = get_next_player_position(current_bettor_index, 1);
  the_bet_function(player_index, current_bet_amount - players[player_index].subtotal_bet);
  
  main();
}

function handle_human_bet (bet_amount) {
  if (bet_amount < 0 || isNaN(bet_amount)) bet_amount = 0;
  var to_call = current_bet_amount - players[current_bettor_index].subtotal_bet;
  bet_amount += to_call;
  var is_ok_bet = the_bet_function(current_bettor_index, bet_amount);
  if (is_ok_bet) {
    players[current_bettor_index].status = "CALL";
	write_player(current_bettor_index, 0, 0);
    current_bettor_index = get_next_player_position(current_bettor_index, 1);
    
    main();
    //gui_hide_guick_raise();
  } else {
    crash_me();
  }
}

function human_fold (player_index=0) {
  players[player_index].status = "FOLD";
  // Clear the buttons - not able to call
  gui_hide_fold_call_click();
  current_bettor_index = get_next_player_position(current_bettor_index, 1);
  write_player(player_index, 0, 0);
  var current_pot_size = get_pot_size();
  gui_write_basic_general(current_pot_size);
  main();
}


function write_player (n, hilite, show_cards) {
  if((n==0)||(players[n].cardsvisible))
	show_cards=1;
  var carda = "";
  var cardb = "";
  var name_background_color = "";
  var name_font_color = "";
  players[n].hilite=hilite;
  sendAll(JSON.stringify(players[n]));
  if (hilite == 1) {            // Current
    name_background_color = BG_HILITE;
    name_font_color = 'black';
  } else if (hilite == 2) {       // Winner
    name_background_color = 'red';
  }
  if (players[n].status == "FOLD") {
    name_font_color = 'black';
    name_background_color = 'gray';
  }
  if (players[n].status == "BUST") {
    name_font_color = 'white';
    name_background_color = 'black';
  }
  if (players[n].status == "SITOUT") {
    name_font_color = 'black';
    name_background_color = 'white';
  }  
  gui_hilite_player(name_background_color, name_font_color, n);

  var show_folded = false;
  // If the human is out of the game
  /*if (players[0].status == "BUST" || players[0].status == "FOLD") {
    show_cards = 1;
  }*/
  if (players[n].carda) {
    if (players[n].status == "FOLD") {
      carda = "";
      show_folded = true;
    } else {
      carda = "blinded";
    }
    if ((show_cards && players[n].status != "FOLD")) {
      carda = players[n].carda;
    }
  }
  if (players[n].cardb) {
    if (players[n].status == "FOLD") {
      cardb = "";
      show_folded = true;
    } else {
      cardb = "blinded";
    }
    if ((show_cards && players[n].status != "FOLD")) {
      cardb = players[n].cardb;
    }
  }
  if (n == button_index) {
	  gui_place_dealer_button(n);
      sendAll("gui_place_dealer_button-"+n)
	//  alert("button")
  }
  var bet_text = "TO BE OVERWRITTEN";
  var allin = "Bet:";

  if (players[n].status == "FOLD") {
    bet_text = "FOLDED (" +
               (players[n].subtotal_bet + players[n].total_bet) + ")";
   if (n == 0) {
      //HUMAN_GOES_ALL_IN = 0;
    }
  } else if (players[n].status == "BUST") {
    bet_text = "BUSTED";
  } else if (players[n].status == "SITOUT") {
    bet_text = "SITOUT";
  } else if (!has_money(n)) {
    bet_text = "ALL IN (" +
               (players[n].subtotal_bet + players[n].total_bet) + ")";
    if (n == 0) {
     // HUMAN_GOES_ALL_IN = 1;
    }
  } else {
    bet_text = allin + "$" + players[n].subtotal_bet +
               " (" + (players[n].subtotal_bet + players[n].total_bet) + ")";
  }
  
  gui_set_player_name(players[n].name, n);    // offset 1 on seat-index
  gui_set_bet(bet_text, n);
  gui_set_bankroll(players[n].bankroll, n);
  gui_set_player_cards(carda, cardb, n, (show_folded) || (players[n].cardsvisible));
  
}

function make_readable_rank (r) {
  if (r < 11) {
    return r;
  } else if (r == 11) {
    return "J";
  } else if (r == 12) {
    return "Q";
  } else if (r == 13) {
    return "K";
  } else if (r == 14) {
    return "A";
  }
}

function get_pot_size () {
  var p = 0;
  for (var i = 0; i < players.length; i++) {
    p += players[i].total_bet + players[i].subtotal_bet;
  }
  return p;
}

function get_pot_size_html () {
  return "<font size=+4><b>TOTAL POT: " + get_pot_size() + "</b></font>";
}

function clear_bets () {
  for (var i = 0; i < players.length; i++) {
    players[i].subtotal_bet = 0;
  }
  current_bet_amount = 0;
}

function clear_pot () {
  for (var i = 0; i < players.length; i++) {
    players[i].total_bet = 0;
  }
}

function reset_player_statuses (type) {
  for (var i = 0; i < players.length; i++) {
/*	  if(players[i].status != "BUST" && players[i].status != "SITOUT")
		  players[i].status = "";*/
	if(players[i].status != "SITOUT")
    {if (type == 0) {
		players[i].cardsvisible=false;
      players[i].status = "";
    } else if (type == 1 && players[i].status != "BUST") {
		players[i].cardsvisible=false;
      players[i].status = "";
    } else if (type == 2 &&
               players[i].status != "FOLD" &&
               players[i].status != "BUST") {
      players[i].status = "";
    }
  }}
}

function get_num_betting () {
  var n = 0;
  for (var i = 0; i < players.length; i++) {
    if (players[i].status != "FOLD" &&
        players[i].status != "BUST" &&
		players[i].status != "SITOUT" &&
        has_money(i)) {
      n++;
    }
  }
  return n;
}
function set_blind()
{
	BIG_BLIND = parseInt(prompt("Set the big blind value",BIG_BLIND ));
}

function set_bankroll()
{
	STARTING_BANKROLL = parseInt(prompt("Set the bankroll",STARTING_BANKROLL ));
}

function change_name () {
/*  var name = prompt("What is your name?", getLocalStorage("playername"));
  if (!name) {
    return;
  }
  if (!players) {
    my_pseudo_alert("Too early to get a name");
    return;
  }
  if (name.length > 14) {
    my_pseudo_alert("Too long, I will call you Sue");
    name = "Sue";
  }
  players[0].name = name;
  write_player(0, 0, 0);
  setLocalStorage("playername", name);*/
}

function help_func () {
  // Open help.html
  window.location.href = 'help.html';
}
function takeActions() {
  // Open help.html
  document.getElementById("action-options").style.display="block";
  document.getElementById("quick-raises").style.display="block";
}
function transfer() {
		var seat=prompt("Which seat number do you want to make server? (seat 1 is bottom left)")
		sendTo(parseInt(seat)-1,"Youreserver")
		setTimeout(function() {window.location.href="pokerclient.html"},2000)

		//

  /*var url = 'https://sourceforge.net/projects/js-css-poker/files/';
  var win = window.open(url, '_blank');
  win.focus();*/
}

function write_settings_frame () {
  var default_speed = "2";
  /*var speed_i = getLocalStorage("gamespeed");
  if (speed_i == "") {
    speed_i = default_speed;
  }
  if (speed_i == null ||
      (speed_i != 0 &&
       speed_i != 1 &&
       speed_i != 2 &&
       speed_i != 3 &&
       speed_i != 4)) {
    speed_i = default_speed;
  }*/
  set_speed(default_speed);
  gui_setup_option_buttons(moveTable,
                           takeActions);/*,
                           update_func,
                           gui_toggle_the_theme_mode);*/
}

function index2speed (index) {
  var speeds = ['2', '1', '.6', '.3', '0.01'];
  return speeds[index];
}

function set_speed (index) {
  global_speed = index2speed(index);
  //setLocalStorage("gamespeed", index);
  //gui_set_selected_speed_option(index);
}

function set_raw_speed (selector_index) {
  // check that selector_index = [1,5]
  /*if (selector_index < 1 || selector_index > 5) {
    my_pseudo_alert("Cannot set speed to " + selector_index);
    selector_index = 3;
  }*/
  var index = selector_index - 1;
  set_speed(index);
}

function get_next_player_position (i, delta) {
  var j = 0;
  var step = 1;
  if (delta < 0) step = -1;

  var loop_on = 0;
  do {
    i += step;
    if (i >= players.length) {
      i = 0;
    } else {
      if (i < 0) {
        i = players.length - 1;
      }
    }

    // Check if we can stop
    loop_on = 0;
    if (players[i].status == "BUST") loop_on = 1;
    if (players[i].status == "FOLD") loop_on = 1;
	if (players[i].status == "SITOUT") loop_on = 1;
    if (++j < delta) loop_on = 1;
  } while (loop_on);

  return i;
}

function getLocalStorage (key) {
  return localStorage.getItem(key);
}

function setLocalStorage (key, value) {
  return localStorage.setItem(key, value);
}

function has_money (i) {
  if (players[i].bankroll >= 0.01) { return true;}
  return false;}
function my_local_subtime (invalue, fractionizer) {
  var quotient = 0;
  var remainder = invalue;
  if (invalue > fractionizer) {
    quotient = Math.floor(invalue / fractionizer);
    remainder = invalue - quotient * fractionizer;
  }
  return [quotient, remainder];
}

function getTimeText (string, number, text) {
  if (number == 0) return string;
  if (string.length > 0) {
    string += " ";
  }
  if (number == 1) {
    string = string + "1 " + text;
  } else {
    string = string + number + " " + text + "s";
  }
  return string;
}

function makeTimeString (milliseconds) {
  var _MS_PER_SECOND = 1000;
  var _MS_PER_MINUTE = 1000 * 60;
  var _MS_PER_HOUR = _MS_PER_MINUTE * 60;
  var _MS_PER_DAY = 1000 * 60 * 60 * 24;
  var _MS_PER_WEEK = _MS_PER_DAY * 7;
  var weeks = 0;
  var days = 0;
  var hours = 0;
  var minutes = 0;
  var seconds = 0;
  [weeks, milliseconds] = my_local_subtime(milliseconds, _MS_PER_WEEK);
  [days, milliseconds] = my_local_subtime(milliseconds, _MS_PER_DAY);
  [hours, milliseconds] = my_local_subtime(milliseconds, _MS_PER_HOUR);
  [minutes, milliseconds] = my_local_subtime(milliseconds, _MS_PER_MINUTE);
  [seconds, milliseconds] = my_local_subtime(milliseconds, _MS_PER_SECOND);

  var string = "";
  string = getTimeText(string, weeks, "week");
  string = getTimeText(string, days, "day");
  string = getTimeText(string, hours, "hour");
  string = getTimeText(string, minutes, "minute");
  string = getTimeText(string, seconds, "second");

  return (string);
}

function start_game()
{
var container = document.querySelector('#jitsi-container');
   var domain = "beta.meet.jit.si";
    var options = {
        "roomName": localStorage.pokerRoomName,
        "parentNode": container,
        "width": 900,
        "height": 600,
	//"openBridgeChannel": true 
    };
    api = new JitsiMeetExternalAPI(domain, options);
	setTimeout(api.executeCommand('toggleTileView'),1000);
    api.addEventListener('endpointTextMessageReceived', text_listener); 
    api.addEventListener('participantJoined', handshake); 

}
function handshake(data)
{
	//alert("Someone joined "+data.id)
	api.executeCommand('sendEndpointTextMessage',data.id,"Whoareyou");
}
var current=1;
function text_listener(data){
	var obj=JSON.parse(JSON.stringify(data));
	var txt=obj.data.eventData.text
	if(txt.includes("-"))
		var which_player=parseInt(txt.split("-")[1]);
	if(txt.includes("PlayerAction"))
		if(obj.data.senderInfo.id==players[which_player].jitsi_id)
	{
		which_player=parseInt(txt.split("-")[1]);
		var action=txt.split("-")[2]
		if(action=="Fold")
			human_fold(current_bettor_index);
		if(action=="Call")
			human_call(current_bettor_index);
		if(action=="Bet")
		{
			var amount=txt.split("-")[3]
			handle_human_bet(parseInt(amount))
		}
	}
//	if(obj.data.eventData.text.includes("Iamplaying"))
//		n_players=n_players+1;
	if(txt.includes("I am"))
	{
		var name=obj.data.eventData.text.split("-")[2];
		replies=replies+1
		if(name!="Watching")
		{
			if(gameStarting)
				{
					players[current].name=name;
					players[current].jitsi_id=obj.data.senderInfo.id;
					sendTo(current,"Game starting-"+current);
					current=current+1;
				}
			else
			{
				var nameFound=false;
				for(var i=0;i<players.length;i++)
				{
					if(name==players[i].name)
						{	
							nameFound=true;
							players[i].jitsi_id=obj.data.senderInfo.id;
							if(players[i].status!="FOLD");
								players[i].status="";
							sendTo(i,"Rejoining-"+i);
							for(var j=0;j<players.length;j++)
								sendTo(i, JSON.stringify(players[j]));
							for(j=0;j<5;j++)
								sendTo(i,"LayCard-"+j+"-"+board[j])
							if(current_bettor_index==i)
								sendTo(i,"Turn-"+i)
						}
				}
				if(!nameFound)
				{ 
					var pl= new player(name, STARTING_BANKROLL, "", "", "", 0, 0,i,0,obj.data.senderInfo.id);
					players.push(pl);
					sendTo(players.length-1,"Game starting-"+players.length-1)
				}
			}
		}
	}
	if(txt.includes("cardsvisible"))
		if(obj.data.senderInfo.id==players[which_player].jitsi_id)
		{
			which_player=parseInt(txt.split("-")[1]);
			players[which_player].cardsvisible=true;
			//sendAll(obj.data.eventData.text);
			write_player(which_player,0,1);
		}
	if(txt.includes("Rebuy"))
				if(obj.data.senderInfo.id==players[which_player].jitsi_id)
	{
		which_player=parseInt(txt.split("-")[1]);
		var howmuch=parseInt(txt.split("-")[2]);
		players[which_player].status="FOLD"
		players[which_player].bankroll=howmuch;
		write_player(parseInt(which_player),2,1);
	}
	/*if(obj.data.eventData.text.includes("Sittingout-"))
	{
		var n=parseInt(obj.data.eventData.text.split("-")[1]);
		players[n].status="SITOUT"
		write_player(parseInt(n),2,1);
	}
	if(obj.data.eventData.text.includes("Iamback-"))
	{
		var n=parseInt(obj.data.eventData.text.split("-")[1]);
		players[n].status="FOLD"
		write_player(parseInt(n),2,1);
	}*/
	if(txt.includes("showWinners"))
		showWinners();
	if(txt.includes("StartNewhand") & (window.performance.now()>(t0+3000)))
	{
		new_round();
		t0=window.performance.now()
	}
}		
	

function sendAll(txt)
{
  /*  var current=1;
	if(text.includes("Game starting"))
	{	
		for(var i=0;i<players.length;i++)
			if(Object.keys(api._participants)[i]!=api._myUserID)
			{
				players[current].jitsi_id=Object.keys(api._participants)[i];
				current++;
			}
		
	}*/
	if(txt.includes("Game starting"))
	{
	for(var i=1;i<players.length;i++)
	{
			txt="Game starting-"+i;
			api.executeCommand('sendEndpointTextMessage',players[i].jitsi_id,txt);
	}
	}
	else
	if(txt.includes("status"))
	{	
		var pl=JSON.parse(txt);
		for(var i=1;i<players.length;i++)
			if((pl.number==i)||(pl.cardsvisible)||(handStatus=="complete"))
				api.executeCommand('sendEndpointTextMessage',players[i].jitsi_id,txt);
			else
				{
					pl.carda="c2";
					pl.cardb="h2";
					api.executeCommand('sendEndpointTextMessage',players[i].jitsi_id,JSON.stringify(pl));
				}
	}
	else	
	for(var i=0;i<Object.keys(api._participants).length;i++)
	{

			api.executeCommand('sendEndpointTextMessage',Object.keys(api._participants)[i],txt);
	}
}
function set_big_blind(n=50)
{
	BIG_BLIND=n;
	sendAll("big_blind-"+n);
	//alert("big_blind")
}
function sendTo(i,txt)
{
		if(txt.includes("status"))
		{	
			var pl=JSON.parse(txt);
			if((pl.number==i)||(pl.cardsvisible)||(handStatus=="complete"))
					api.executeCommand('sendEndpointTextMessage',players[i].jitsi_id,txt);
				else
					{
						pl.carda="c2";
						pl.cardb="h2";
						api.executeCommand('sendEndpointTextMessage',players[i].jitsi_id,JSON.stringify(pl));
					}
		}
	else	
		api.executeCommand('sendEndpointTextMessage',players[i].jitsi_id,txt);
}
function giveCard(which,who,value)
{  
		api.executeCommand('sendEndpointTextMessage',players[who].jitsi_id,"Card"+which+"-"+value);
}
function gui_write_game_response_server(message)
{
	sendAll("game_response-"+message);
	gui_write_game_response(message);
}
function gui_write_basic_general_server(value)
{
	sendAll("basic general-"+value)
	gui_write_basic_general(value);
}

function sendAllParticipants(message)
{
	for(var i=0;i<Object.keys(api._participants).length;i++)
		api.executeCommand('sendEndpointTextMessage',Object.keys(api._participants)[i],message);
	
}
function wrap_server(my_func)
{
	sendAll(my_func.name+"-"+value)
	my_func(value)
}
function clearTable()
{
for(var i=0;i<5;i++)
	sendAll("LayCard-"+i+"-")
}
function  moveTable()
{
	var left=document.getElementById("jitsi-container").style.left;
	var y=document.getElementById("jitsi-container").style.top;
	if((left=="800px")&(y=="0px"))
	{
		left="0px";
		y="600px";
	}
    else if((left=="0px")&(y=="600px"))
	{
		left="0px";
		y="0px";
	}	
    else if((left=="0px")&(y=="0px"))
	{
		left="800px";
		y="0px";
	}	
	document.getElementById("jitsi-container").style.left=left;
	document.getElementById("jitsi-container").style.top=y;
}

function toggle_player_status()
{
	if(players[parseInt(whoami)].status=="BUST")
	{	
		alert("You are about to buy/rebuy");
		 var howmuch = prompt("How much do you want to rebuy? (0 if you don't want to",0);
		 if(howmuch>0)
		 {
		players[0].status="FOLD"
		players[0].bankroll=howmuch;
		wriTte_player(0,2,1);
		 }
	}
	else if(players[parseInt(whoami)].status=="SITOUT")
		players[0].status="FOLD"
	else if(players[parseInt(whoami)].status=="")
		players[0].status="SITOUT"
}


////////////////////////////////////////////////////////////hands.js-css-poker/files/// straight don't check 4 inside draws
"use strict";

var tests = ["straight_flush", "four_of_a_kind", "full_house", "flush", "straight", "three_of_a_kind", "two_pair", "one_pair", "hi_card"];

function get_winners (my_players) {
  var winners;
  for (var i = 0; i < tests.length; i++) {
    winners = winners_helper(my_players, tests[i]);
    if (winners) {
      /*
      var s="";
      for(var j=0;j<winners.length;j++) {
        if(winners[j]>0)
          s+=my_players[j].name+",\n";
      }
      alert(tests[i]+"!!!\n\n"+s);
      */
      break;
    }
  }
  return winners;
}

function execute_test (string, player) {
  if (string === 'test_straight_flush') {
    return test_straight_flush(player);
  }
  if (string === 'test_four_of_a_kind') {
    return test_four_of_a_kind(player);
  }
  if (string === 'test_full_house') {
    return test_full_house(player);
  }
  if (string === 'test_flush') {
    return test_flush(player);
  }
  if (string === 'test_straight') {
    return test_straight(player);
  }
  if (string === 'test_three_of_a_kind') {
    return test_three_of_a_kind(player);
  }
  if (string === 'test_two_pair') {
    return test_two_pair(player);
  }
  if (string === 'test_one_pair') {
    return test_one_pair(player);
  }
  if (string === 'test_hi_card') {
    return test_hi_card(player);
  }
  alert("execute_test() cannot tokenize " + string);
}

function execute_compare (string, hand_in, best_hand) {
  if (string === 'compare_straight_flush') {
    return compare_straight_flush(hand_in, best_hand);
  }
  if (string === 'compare_four_of_a_kind') {
    return compare_four_of_a_kind(hand_in, best_hand);
  }
  if (string === 'compare_full_house') {
    return compare_full_house(hand_in, best_hand);
  }
  if (string === 'compare_flush') {
    return compare_flush(hand_in, best_hand);
  }
  if (string === 'compare_straight') {
    return compare_straight(hand_in, best_hand);
  }
  if (string === 'compare_three_of_a_kind') {
    return compare_three_of_a_kind(hand_in, best_hand);
  }
  if (string === 'compare_two_pair') {
    return compare_two_pair(hand_in, best_hand);
  }
  if (string === 'compare_one_pair') {
    return compare_one_pair(hand_in, best_hand);
  }
  if (string === 'compare_hi_card') {
    return compare_hi_card(hand_in, best_hand);
  }
  alert("execute_compare() cannot tokenize " + string);
}

function winners_helper (my_players, test) {
  var best;
  var winners = new Array(my_players.length);
  for (var i = 0; i < my_players.length; i++) {
    if (!my_players[i]) { // Busted or folded
      continue;
    }
    var a = execute_test("test_" + test, my_players[i]);
    //    var a_str = JSON.stringify(a, null, 4)
    //    gui_log_to_history("test_" + test + "(" + my_players[i].name + ") returned " + a_str);
    var num_needed = a["num_needed"];
    if (num_needed > 0 || (num_needed == 0 && num_needed != "0")) {
      continue;
    }
    if (typeof best === 'undefined') {
      best = a;
      winners = new Array(my_players.length); // intentional ? zorro
      winners[i] = a;
    } else {
      var comp = execute_compare("compare_" + test, a, best);
      // gui_log_to_history("compare_" + test + "(" + a_str + "," + best + ") returned " + comp);
      // alert("TESTING "+my_players[i].name+"'s "+test+"\na: "+a+"\nb: "+best+"\n\nwinner: "+comp);
      if (comp == "a") { // a won
        best = a;
        winners = new Array(my_players.length); // intentional ? zorro
        winners[i] = a;
      } else if (comp == "b") { // 'best' is still  best
      } else if (comp == "c") { // A draw, add as a winner
        winners[i] = a;
      }
    }
  }
  for (i = 0; i < winners.length; i++) {
    if (winners[i]) {
      return winners;
    }
  }
  return null;
}

function test_straight_flush (player) {
  var my_cards = group_cards(player);
  var the_suit = get_predominant_suit(my_cards);
  var working_cards = new Array(8);
  var working_index = 0;
  for (var i = 0; i < 7; i++) {
    if (get_suit(my_cards[i]) == the_suit) {
      var my_rank = get_rank(my_cards[i]);
      working_cards[working_index++] = my_rank;
      if (my_rank == 14) {
        working_cards[7] = 1; // ace==1 too
      }
    }
  }
  for (i = 0; i < working_cards.length; i++) {
    if (working_cards[i] == null) {
      working_cards[i] = -1; // FF
    }
  }
  working_cards.sort(compNum);
  var absolute_longest_stretch = 0;
  var absolute_hi_card = 0;
  var current_longest_stretch = 1;
  var current_hi_card = 0;
  for (i = 0; i < 8; i++) {
    var a = working_cards[i];
    var b = working_cards[i + 1];
    if (a && b && a - b == 1) {
      current_longest_stretch++;
      if (current_hi_card < 1) current_hi_card = a;
    } else if (a) {
      if (current_longest_stretch > absolute_longest_stretch) {
        absolute_longest_stretch = current_longest_stretch;
        if (current_hi_card < 1) current_hi_card = a;
        absolute_hi_card = current_hi_card;
      }
      current_longest_stretch = 1;
      current_hi_card = 0;
    }
  }
  var num_mine = 0;
  for (i = 0; i < absolute_longest_stretch; i++) {
    if (the_suit + (absolute_hi_card - i) == player.carda || the_suit + (absolute_hi_card - i) == player.cardb) num_mine++;
  }
  var hash_result = {};
  hash_result["straight_hi"] = absolute_hi_card;
  hash_result["num_needed"] = 5 - absolute_longest_stretch;
  hash_result["num_mine"] = num_mine;
  hash_result["hand_name"] = "Straight Flush";

  return hash_result;
}

function compare_straight_flush (a, b) {
  return compare_straight(a, b);
}

function test_four_of_a_kind (player) {
  var i;
  var my_cards = group_cards(player);
  var ranks = new Array(13);
  for (i = 0; i < 13; i++) {
    ranks[i] = 0;
  }
  for (i = 0; i < my_cards.length; i++) {
    ranks[get_rank(my_cards[i]) - 2]++;
  }
  var four = "";
  var kicker = "";
  for (i = 0; i < 13; i++) {
    if (ranks[i] == 4) {
      four = i + 2;
    } else if (ranks[i] > 0) {
      kicker = i + 2;
    }
  }
  var num_mine = 0;
  if (get_rank(player.carda) == four) {
    num_mine++;
  }
  if (get_rank(player.cardb) == four) {
    num_mine++;
  }
  var num_needed = 4;
  if (four) {
    num_needed = 0;
  }

  var hash_result = {};
  hash_result["rank"] = four;
  hash_result["kicker"] = kicker;
  hash_result["num_needed"] = num_needed;
  hash_result["num_mine"] = num_mine;
  hash_result["hand_name"] = "Four of a Kind";

  return hash_result;
}

function compare_four_of_a_kind (a, b) {
  var rank_a = a["rank"];
  var rank_b = b["rank"];
  if (rank_a > rank_b) return "a";
  else if (rank_b > rank_a) return "b";
  else {
    var kicker_a = a["kicker"];
    var kicker_b = b["kicker"];
    if (kicker_a > kicker_b) return "a";
    else if (kicker_b > kicker_a) return "b";
    else return "c";
  }
}

function test_full_house (player) {
  var my_cards = group_cards(player);
  var ranks = new Array(13);
  var i;
  for (i = 0; i < 13; i++) {
    ranks[i] = 0;
  }
  for (i = 0; i < my_cards.length; i++) {
    ranks[get_rank(my_cards[i]) - 2]++;
  }
  var three = "";
  var two = "";
  for (i = 0; i < 13; i++) {
    if (ranks[i] == 3) {
      if (three > two) {
        two = three;
      }
      three = i + 2;
    } else if (ranks[i] == 2) {
      two = i + 2;
    }
  }
  var num_needed = 5;
  var major_rank = "";
  var num_mine_major = 0;
  if (three) {
    num_needed -= 3;
    major_rank = three;
    if (get_rank(player.carda) == three) num_mine_major += 1;
    if (get_rank(player.cardb) == three) num_mine_major += 1;
  }
  var hash_result = {};
  hash_result["major_rank"] = major_rank;
  hash_result["num_mine_major"] = num_mine_major;

  var minor_rank = "";
  var num_mine_minor = 0;
  if (two) {
    num_needed -= 2;
    minor_rank = two;
    if (get_rank(player.carda) == two) num_mine_minor += 1;
    if (get_rank(player.cardb) == two) num_mine_minor += 1;
  }
  hash_result["minor_rank"] = minor_rank;
  hash_result["num_mine_minor"] = num_mine_minor;
  hash_result["num_mine"] = num_mine_minor + num_mine_major;
  hash_result["num_needed"] = num_needed;
  hash_result["hand_name"] = "Full House";

  return hash_result;
}

function compare_full_house (a, b) {
  var major_a = a["major_rank"];
  var major_b = b["major_rank"];
  if (major_a > major_b) return "a";
  else if (major_b > major_a) return "b";
  else {
    var minor_a = a["minor_rank"];
    var minor_b = b["minor_rank"];
    if (minor_a > minor_b) return "a";
    else if (minor_b > minor_a) return "b";
    else return "c";
  }
}

function test_flush (player) {
  var i;
  var my_cards = group_cards(player);
  var the_suit = get_predominant_suit(my_cards);
  var working_cards = new Array(7);
  var working_index = 0;
  var num_in_flush = 0;
  for (i = 0; i < my_cards.length; i++) {
    if (get_suit(my_cards[i]) == the_suit) {
      num_in_flush++;
      working_cards[working_index++] = get_rank(my_cards[i]);
    }
  }
  for (i = 0; i < working_cards.length; i++) {
    if (working_cards[i] == null) {
      working_cards[i] = -1; // FF
    }
  }
  working_cards.sort(compNum);
  var hash_result = {};

  var num_mine = 0;
  for (i = 0; i < 5; i++) {
    var s = working_cards[i];
    if (!s) s = "";
    hash_result["flush_" + i] = s;
    if (the_suit + working_cards[i] == player.carda || the_suit + working_cards[i] == player.cardb) num_mine++;
  }
  hash_result["num_needed"] = 5 - num_in_flush;
  hash_result["num_mine"] = num_mine;
  hash_result["suit"] = the_suit;
  hash_result["hand_name"] = "Flush";

  return hash_result;
}

function compare_flush (a, b) {
  for (var i = 0; i < 5; i++) {
    var flush_a = a["flush_" + i];
    var flush_b = b["flush_" + i];
    if (flush_a > flush_b) {
      return "a";
    } else if (flush_b > flush_a) {
      return "b";
    }
  }
  return "c";
}

function test_straight (player) {
  var i;
  var my_cards = group_cards(player);
  var working_cards = new Array(8);
  var ranks = new Array(13);
  for (i = 0; i < 7; i++) {
    var my_rank = get_rank(my_cards[i]);
    if (ranks[my_rank - 2]) continue;
    else ranks[my_rank - 2] = 1;
    working_cards[i] = my_rank;
    if (my_rank == 14) {
      working_cards[7] = 1; // ace==1 too
    }
  }
  for (i = 0; i < working_cards.length; i++) {
    if (working_cards[i] == null) {
      working_cards[i] = -1; // FF
    }
  }
  working_cards.sort(compNum);
  var absolute_longest_stretch = 0;
  var absolute_hi_card = 0;
  var current_longest_stretch = 1;
  var current_hi_card = 0;
  for (i = 0; i < 8; i++) {
    var a = working_cards[i];
    var b = working_cards[i + 1];
    if (a && b && a - b == 1) {
      current_longest_stretch++;
      if (current_hi_card < 1) {
        current_hi_card = a;
      }
    } else if (a) {
      if (current_longest_stretch > absolute_longest_stretch) {
        absolute_longest_stretch = current_longest_stretch;
        if (current_hi_card < 1) {
          current_hi_card = a;
        }
        absolute_hi_card = current_hi_card;
      }
      current_longest_stretch = 1;
      current_hi_card = 0;
    }
  }
  var num_mine = 0;
  for (i = 0; i < absolute_longest_stretch; i++) {
    if (absolute_hi_card - i == get_rank(player.carda) ||
        absolute_hi_card - i == get_rank(player.cardb)) {
      num_mine++;
    }
  }
  var hash_result = {};
  hash_result["straight_hi"] = absolute_hi_card;
  hash_result["num_needed"] = 5 - absolute_longest_stretch;
  hash_result["num_mine"] = num_mine;
  hash_result["hand_name"] = "Straight";

  return hash_result;
}

function compare_straight (a, b) {
  var hi_a = a["straight_hi"];
  var hi_b = b["straight_hi"];
  if (hi_a > hi_b) {
    return "a";
  } else if (hi_b > hi_a) {
    return "b";
  } else {
    return "c";
  }
}

function test_three_of_a_kind (player) {
  var i;
  var my_cards = group_cards(player);
  var ranks = new Array(13);
  for (i = 0; i < 13; i++) {
    ranks[i] = 0;
  }
  for (i = 0; i < my_cards.length; i++) {
    ranks[get_rank(my_cards[i]) - 2]++;
  }
  var three = "";
  var kicker_1 = "";
  var kicker_2 = "";
  for (i = 0; i < 13; i++) {
    if (ranks[i] == 3) {
      three = i + 2;
    } else if (ranks[i] == 1) {
      kicker_2 = kicker_1;
      kicker_1 = i + 2;
    } else if (ranks[i] > 1) {
      kicker_1 = i + 2;
      kicker_2 = i + 2;
    }
  }
  var num_mine = 0;
  if (get_rank(player.carda) == three) {
    num_mine++;
  }
  if (get_rank(player.cardb) == three) {
    num_mine++;
  }
  var num_needed = 3;
  if (three) {
    num_needed = 0;
  }
  var hash_result = {};
  hash_result["rank"] = three;
  hash_result["num_needed"] = num_needed;
  hash_result["num_mine"] = num_mine;
  hash_result["kicker_1"] = kicker_1;
  hash_result["kicker_2"] = kicker_2;
  hash_result["hand_name"] = "Three of a Kind";

  return hash_result;
}

function compare_three_of_a_kind (a, b) {
  var rank_a = a["rank"];
  var rank_b = b["rank"];
  if (rank_a > rank_b) {
    return "a";
  }
  if (rank_b > rank_a) {
    return "b";
  }
  var kicker_a = a["kicker_1"];
  var kicker_b = b["kicker_1"];
  if (kicker_a > kicker_b) {
    return "a";
  }
  if (kicker_b > kicker_a) {
    return "b";
  }
  kicker_a = a["kicker_2"];
  kicker_b = b["kicker_2"];
  if (kicker_a > kicker_b) {
    return "a";
  }
  if (kicker_b > kicker_a) {
    return "b";
  }
  return "c";
}

function test_two_pair (player) {
  var i;
  var my_cards = group_cards(player);
  var ranks = new Array(13);
  for (i = 0; i < 13; i++) ranks[i] = 0;
  for (i = 0; i < my_cards.length; i++) ranks[get_rank(my_cards[i]) - 2]++;
  var first = "";
  var second = "";
  var kicker = "";
  for (i = 12; i > -1; i--) {
    if (ranks[i] == 2) {
      if (!first) {
        first = i + 2;
      } else if (!second) {
        second = i + 2;
      } else if (!kicker) {
        kicker = i + 2;
      } else {
        break;
      }
    } else if (!kicker && ranks[i] > 0) {
      kicker = i + 2;
    }
  }
  var num_mine = 0;
  if (get_rank(player.carda) == first || get_rank(player.carda) == second) {
    num_mine++;
  }
  if (get_rank(player.cardb) == first || get_rank(player.cardb) == second) {
    num_mine++;
  }
  var num_needed = 2;
  if (second) num_needed = 0;
  else if (first) num_needed = 1;
  else num_needed = 2;
  var hash_result = {};
  hash_result["rank_1"] = first;
  hash_result["rank_2"] = second;
  hash_result["num_needed"] = num_needed;
  hash_result["num_mine"] = num_mine;
  hash_result["kicker"] = kicker;
  hash_result["hand_name"] = "Two Pair";

  return hash_result;
}

function compare_two_pair (a, b) {
  var rank_a = a["rank_1"];
  var rank_b = b["rank_1"];
  if (rank_a > rank_b) {
    return "a";
  }
  if (rank_b > rank_a) {
    return "b";
  }
  rank_a = a["rank_2"];
  rank_b = b["rank_2"];
  if (rank_a > rank_b) {
    return "a";
  }
  if (rank_b > rank_a) {
    return "b";
  }
  var kicker_a = a["kicker"];
  var kicker_b = b["kicker"];
  if (kicker_a > kicker_b) {
    return "a";
  }
  if (kicker_b > kicker_a) {
    return "b";
  }
  return "c";
}

function test_one_pair (player) {
  var i;
  var my_cards = group_cards(player);
  var ranks = new Array(13);
  for (i = 0; i < 13; i++) {
    ranks[i] = 0;
  }
  for (i = 0; i < my_cards.length; i++) {
    ranks[get_rank(my_cards[i]) - 2]++;
  }
  var pair = 0;
  var kicker_1 = "";
  var kicker_2 = "";
  var kicker_3 = "";
  for (i = 0; i < 13; i++) {
    if (ranks[i] == 2) {
      pair = i + 2;
    } else if (ranks[i] == 1) {
      kicker_3 = kicker_2;
      kicker_2 = kicker_1;
      kicker_1 = i + 2;
    } else if (ranks[i] > 2) {
      kicker_1 = i + 2;
      kicker_2 = i + 2;
      kicker_3 = i + 2;
    }
  }
  var num_mine = 0;
  if (get_rank(player.carda) == pair) num_mine++;
  if (get_rank(player.cardb) == pair) num_mine++;
  var num_needed = 1;
  if (pair) num_needed = 0;
  var hash_result = {};
  hash_result["rank"] = pair;
  hash_result["num_needed"] = num_needed;
  hash_result["num_mine"] = num_mine;
  hash_result["kicker_1"] = kicker_1;
  hash_result["kicker_2"] = kicker_2;
  hash_result["kicker_3"] = kicker_3;
  hash_result["hand_name"] = "One Pair";

  return hash_result;
}

function compare_one_pair (a, b) {
  var rank_a = a["rank"];
  var rank_b = b["rank"];
  if (rank_a > rank_b) {
    return "a";
  }
  if (rank_b > rank_a) {
    return "b";
  }
  var kicker_a = a["kicker_1"];
  var kicker_b = b["kicker_1"];
  if (kicker_a > kicker_b) {
    return "a";
  }
  if (kicker_b > kicker_a) {
    return "b";
  }
  kicker_a = a["kicker_2"];
  kicker_b = b["kicker_2"];
  if (kicker_a > kicker_b) {
    return "a";
  }
  if (kicker_b > kicker_a) {
    return "b";
  }
  kicker_a = a["kicker_3"];
  kicker_b = b["kicker_3"];
  if (kicker_a > kicker_b) {
    return "a";
  }
  if (kicker_b > kicker_a) {
    return "b";
  }
  return "c";
}

function test_hi_card (player) {
  var i;
  var my_cards = group_cards(player);
  var working_cards = new Array(my_cards.length);
  for (i = 0; i < working_cards.length; i++) {
    working_cards[i] = get_rank(my_cards[i]);
  }
  for (i = 0; i < working_cards.length; i++) {
    if (working_cards[i] == null) {
      working_cards[i] = -1; // FF
    }
  }
  working_cards.sort(compNum);
  var hash_result = {};
  for (i = 0; i < 5; i++) {
    if (!working_cards[i]) {
      working_cards[i] = "";
    }
    hash_result["hi_card_" + i] = working_cards[i];
  }
  hash_result["num_needed"] = 0;
  hash_result["hand_name"] = "High Card";

  return hash_result;
}

function compare_hi_card (a, b) {
  for (var i = 0; i < 5; i++) {
    var hi_a = a["hi_card_" + i];
    var hi_b = b["hi_card_" + i];
    if (hi_a > hi_b) return "a";
    if (hi_b > hi_a) return "b";
  }
  return "c";
}

function get_suit (card) {
  if (card) {
    return card.substring(0, 1);
  }
  return "";
}

function get_rank (card) {
  if (card) {
    return card.substring(1) - 0;
  }
  return "";
}

function get_predominant_suit (my_cards) {
  var suit_count = [0, 0, 0, 0];
  for (var i = 0; i < my_cards.length; i++) {
    var s = get_suit(my_cards[i]);
    if (s == "c") suit_count[0]++;
    else if (s == "s") suit_count[1]++;
    else if (s == "h") suit_count[2]++;
    else if (s == "d") suit_count[3]++;
  }
  var suit_index = 0;
  if (suit_count[1] > suit_count[suit_index]) suit_index = 1;
  if (suit_count[2] > suit_count[suit_index]) suit_index = 2;
  if (suit_count[3] > suit_count[suit_index]) suit_index = 3;
  if (suit_index == 0) return "c";
  if (suit_index == 1) return "s";
  if (suit_index == 2) return "h";
  if (suit_index == 3) return "d";
  return "";
}

function group_cards (player) {
  var c = new Array(7);
  for (var i = 0; i < 5; i++) {
    c[i] = board[i];
  }
  c[5] = player.carda;
  c[6] = player.cardb;
  return c;
}

function compNum (a, b) {
  return b - a;
}


////////////////////////////////////////////////////////////////////////////////////// pokerclient.js







function toggle_player_status_client()//LEAVE IN
{
	if(players[parseInt(whoami)].status=="BUST")
	{	
		alert("You are about to buy/rebuy");
		 var howmuch = prompt("How much do you want to rebuy? (0 if you don't want to",0);
		 if(howmuch>0)
			send("Rebuy-"+whoami+"-"+howmuch);
	}
	else if(players[parseInt(whoami)].status=="SITOUT")
		send("Iamback-"+whoami);
	else if(players[parseInt(whoami)].status=="")
		send("Sittingout-"+whoami);
}



function showCards_client()
{
	send("cardsvisible-"+whoami)
	//players[parseInt(whoami)].cardsvisible=true;
}


function init_client ()//LEAVE IN
 {
  if (!has_local_storage()) {
    my_pseudo_alert("Your browser do not support localStorage - " +
                    "try a more modern browser like Firefox");
    return;
  }
  gui_hide_poker_table();
  gui_hide_log_window();
  gui_hide_setup_option_buttons();
  gui_hide_fold_call_click();
  gui_hide_guick_raise();
  gui_hide_dealer_button();
 // gui_hide_game_response();
  gui_initialize_theme_mode();
  new_game_client();
}


function handle_how_many_reply_client() //LEAVE IN
{
  var opponents=Object.keys(api._participants).length-1;
  gui_write_modal_box("");
  write_settings_frame_client();
  new_game_continues_client(opponents);
  gui_initialize_css();         // Load background images
  gui_show_game_response();
  /*for (var i = 0; i < board.length; i++) {
    if (i > 4) {        // board.length != 5
      continue;
    }
    board[i] = "";
    gui_lay_board_card(i, board[i]);     // Clear the board
  }
  for (i = 0; i < 3; i++) {
    board[i] = "";
    gui_burn_board_card(i, board[i]);
  }*/
  for (var i = 0; i < 5; i++) {
    gui_lay_board_card(i, "");     // Clear the board
  }
  for (i = 0; i < 3; i++) {
    gui_burn_board_card(i, "");
  }
}


function new_game_client ()//LEAVE IN
 {
  START_DATE = new Date();
  NUM_ROUNDS = 0;
  initialize_game();
  start_game_client();
  
  //handle_how_many_reply(Object.keys(api._participants).length)
}

function new_game_continues_client(req_no_opponents)
 {
  //alert("About to create players")
  clear_player_cards(9);
  players = new Array(req_no_opponents + 1);
  for (var i = 0; i < players.length;  i++) { //Object.keys(api._participants).length;
  players[i] = new player(i, 0, "", "", "", 0, 0);}
 }


var to_call=0;
function actions_client()
{
{	current_bettor_index=parseInt(whoami);
	write_player_client(current_bettor_index,1,1);
			document.getElementById("action-options").style="left:310px";
		document.getElementById("quick-raises").style="left:310px";
	  var to_call = current_bet_amount - players[current_bettor_index].subtotal_bet;
	  var call_button_text = "<u>C</u>all - <b>"+to_call+"</b>";
      var fold_button_text = "<u>F</u>old";
      
      if (to_call > players[current_bettor_index].bankroll) {
        to_call = players[current_bettor_index].bankroll;
      }
      var that_is_not_the_key_you_are_looking_for;
      if (to_call == 0) {
        call_button_text = "<u>C</u>heck";
        fold_button_text = "<u>F</u>old";
        that_is_not_the_key_you_are_looking_for = function (key) {
          if (key == 67) {         // Check
            human_call_client(current_bettor_index);
          } else if ((key == 70)&&(get_num_betting()>1)) {  // Fold
            human_fold_client(current_bettor_index);
          } else {
            return true;           // Not my business
          }
          return false;
        };
      } else {
        that_is_not_the_key_you_are_looking_for = function (key) {
          if (key == 67) {         // Call
            human_call_client(current_bettor_index);
          } else if (key == 70) {  // Fold
            human_fold_client(current_bettor_index);
			
          } else {
            return true;           // Not my business
          }
          return false;
        };
      }
      // Fix the shortcut keys - structured and simple
      // Called through a key event
      var ret_function = function (key_event) {
        actual_function(key_event.keyCode, key_event);
      }

      // Called both by a key press and click on button.
      // Why? Because we want to disable the shortcut keys when done
      var actual_function = function (key, key_event) {
        if (that_is_not_the_key_you_are_looking_for(key)) {
          return;
        }
        gui_disable_shortcut_keys(ret_function);
        if (key_event != null) {
          key_event.preventDefault();
        }
      };

      // And now set up so the key click also go to 'actual_function'
      var do_fold = function () {
        actual_function(70, null);
      };
      var do_call = function () {
        actual_function(67, null);
      };
      // Trigger the shortcut keys
      gui_enable_shortcut_keys(ret_function);
	if(get_num_betting()==1)
		fold_button_text=0;
      // And enable the buttons
     gui_setup_fold_call_click(fold_button_text,  call_button_text,  do_fold,   do_call);
	//<input id="number" type="number" value="42">
     var quick_values = new Array(6);
      //if (to_call < players[current_bettor_index].bankroll) {
      var quick_start = BIG_BLIND;
      //}
      var i;
      for (i = 0; i < 5; i++) {
        if (quick_start + BIG_BLIND * i < players[current_bettor_index].bankroll) {
          quick_values[i + 1] = quick_start + BIG_BLIND * i;
        }
      }
      var bet_or_raise = "Bet";
      if (to_call > 0) {
        bet_or_raise = "Raise";
      }
      var quick_bets = "<b>Quick " + bet_or_raise + "s</b><br>";
      for (i = 0; i < 6; i++) {
        if (quick_values[i]) {
          quick_bets += "<button onclick='javascript:parent.handle_human_bet_client(" +
                        quick_values[i] + ")'>" + quick_values[i] + "</a>" +
                        "&nbsp;&nbsp;&nbsp;";
        }
      }
      quick_bets += "<button onclick href='javascript:parent.handle_human_bet_client(" +
                    players[current_bettor_index].bankroll + ")'>All In!</a>";
      var html9 = "<td><table align=center><tr><td align=center>";
      var html10 = quick_bets +
                   "</td></tr></table></td></tr></table><input id='number' type='number' value='"+BIG_BLIND+"'><input name=y type=button value='BET ' onclick='javascript:parent.handle_custom_human_bet_client()'></body></html>";
      gui_write_guick_raise(html9 + html10);

      var hi_lite_color = gui_get_theme_mode_highlite_color();
      var message = "<tr><td><font size=+2><b>Current raise: " +
                    current_bet_amount +
                    "</b><br> You need <font color=" + hi_lite_color +
                    " size=+3>" + to_call +
                    "</font> more to call.</font></td></tr>";
      gui_write_game_response(message);
      write_player_client(current_bettor_index, 1, 1);
      //return;
  }
}




var global_pot_remainder = 0;



function handle_custom_human_bet_client(){handle_human_bet_client(parseInt(document.getElementById("number").value))};



function the_bet_function_client(player_index, bet_amount) {
  if (players[player_index].status == "FOLD") {
    return 0;
    // FOLD ;
  } else if (bet_amount >= players[player_index].bankroll) { // ALL IN
    bet_amount = players[player_index].bankroll;

    var old_current_bet = current_bet_amount;

    if (players[player_index].subtotal_bet + bet_amount > current_bet_amount) {
      current_bet_amount = players[player_index].subtotal_bet + bet_amount;
    }

    // current_min_raise should be calculated earlier ? <--
    /*var new_current_min_raise = current_bet_amount - old_current_bet;
    if (new_current_min_raise > current_min_raise) {
      current_min_raise = new_current_min_raise;
    }*/
    players[player_index].status = "CALL";
  } else if (bet_amount + players[player_index].subtotal_bet ==
             current_bet_amount) { // CALL
    players[player_index].status = "CALL";
  } else if (current_bet_amount >
             players[player_index].subtotal_bet + bet_amount) { // 2 SMALL
    // COMMENT OUT TO FIND BUGS
    if (player_index == 0) {
      my_pseudo_alert("The current bet to match is " + current_bet_amount +
                      "\nYou must bet a total of at least " +
                      (current_bet_amount - players[player_index].subtotal_bet) +
                      " or fold.");
    }
    return 0;
  } else if (bet_amount + players[player_index].subtotal_bet >
             current_bet_amount && // RAISE 2 SMALL
             get_pot_size_client() > 0 &&
             bet_amount + players[player_index].subtotal_bet - current_bet_amount < current_min_raise) {
    // COMMENT OUT TO FIND BUGS
    if (player_index == 0) {
      my_pseudo_alert("Minimum raise is currently " + current_min_raise + ".");
    }
    return 0;
  } else { // RAISE
    players[player_index].status = "CALL";

    var previous_current_bet = current_bet_amount;
    current_bet_amount = players[player_index].subtotal_bet + bet_amount;

    /*if (get_pot_size_client() > 0) {
      current_min_raise = current_bet_amount - previous_current_bet;
      if (current_min_raise < BIG_BLIND) {
        current_min_raise = BIG_BLIND;
      }
    }*/
  }
  players[player_index].subtotal_bet += bet_amount;
  players[player_index].bankroll -= bet_amount;
  var current_pot_size = get_pot_size_client();
  gui_write_basic_general(current_pot_size);
  return 1;
}

function human_call_client(player_index=0) {
	send("PlayerAction-"+whoami+"-Call")
  // Clear buttons
  gui_hide_fold_call_click();
  players[player_index].status = "CALL";
  write_player_client(player_index, 0, 0);
  current_bettor_index = get_next_player_position(current_bettor_index, 1);
  the_bet_function_client(player_index, current_bet_amount - players[player_index].subtotal_bet);
  main();
}

function handle_human_bet_client (bet_amount) {
	
  if (bet_amount < 0 || isNaN(bet_amount)) bet_amount = 0;
  var to_call = current_bet_amount - players[current_bettor_index].subtotal_bet;
  //bet_amount += to_call;
  var is_ok_bet = the_bet_function_client(current_bettor_index, bet_amount);
  if (is_ok_bet) {
    players[current_bettor_index].status = "CALL";
	write_player_client(current_bettor_index, 0, 0);
    current_bettor_index = get_next_player_position(current_bettor_index, 1);
    send("PlayerAction-"+whoami+"-Bet-"+bet_amount)
    main();
    gui_hide_guick_raise();
  } else {
    crash_me();
  }
}

function human_fold_client(player_index=0) {
  send("PlayerAction-"+whoami+"-Fold")
  players[player_index].status = "FOLD";
  // Clear the buttons - not able to call
  gui_hide_fold_call_click();
  current_bettor_index = get_next_player_position(current_bettor_index, 1);
  write_player_client(player_index, 0, 0);
  var current_pot_size = get_pot_size_client();
  gui_write_basic_general(current_pot_size);
  main();
}


function write_player_client(n, hilite,show_cards) {
  var carda = "";
  var cardb = "";
  var name_background_color = "";
  var name_font_color = "";
  show_cards=(show_cards)||(players[n].cardsvisible)
  
  if (hilite == 1) {            // Current
    name_background_color = BG_HILITE;
    name_font_color = 'black';
  } else if (hilite == 2) {       // Winner
    name_background_color = 'red';
  }
  if (players[n].status == "FOLD") {
    name_font_color = 'black';
    name_background_color = 'gray';
  }
  if (players[n].status == "BUST") {
    name_font_color = 'white';
    name_background_color = 'black';
  }
   if (players[n].status == "SITOUT") {
    name_font_color = 'black';
    name_background_color = 'white';
  }  
 
  gui_hilite_player(name_background_color, name_font_color, n);
  var show_folded = false;
  // If the human is out of the game
  /*if (players[0].status == "BUST" || players[0].status == "FOLD") {
    show_cards = 1;
  }*/
  if (players[n].carda) {
    if (players[n].status == "FOLD") {
      carda = "";
      show_folded = true;
    } else {
      carda = "blinded";
    }
    if ((show_cards && players[n].status != "FOLD")) {
      carda = players[n].carda;
    }
  }
  if (players[n].cardb) {
    if (players[n].status == "FOLD") {
      cardb = "";
      show_folded = true;
    } else {
      cardb = "blinded";
    }
    if ((show_cards && players[n].status != "FOLD")) {
      cardb = players[n].cardb;
    }
  }
  if (n == button_index) {
    gui_place_dealer_button(n);
  }
  var bet_text = "TO BE OVERWRITTEN";
  var allin = "Bet:";

  if (players[n].status == "FOLD") {
    bet_text = "FOLDED (" +
               (players[n].subtotal_bet + players[n].total_bet) + ")";
    if (n == 0) {
     // HUMAN_GOES_ALL_IN = 0;
    }
  } else if (players[n].status == "BUST") 
  {
    bet_text = "BUSTED";
  }else if (players[n].status == "SITOUT") {
    bet_text = "SITOUT";
  }
  else if (!has_money(n)) {
    bet_text = "ALL IN (" +
               (players[n].subtotal_bet + players[n].total_bet) + ")";
    if (n == 0) {
      //HUMAN_GOES_ALL_IN = 1;
    }
  } else {
    bet_text = allin + "$" + players[n].subtotal_bet +
               " (" + (players[n].subtotal_bet + players[n].total_bet) + ")";
  }

  gui_set_player_name(players[n].name, n);    // offset 1 on seat-index
  gui_set_bet(bet_text, n);
  gui_set_bankroll(players[n].bankroll, n);
  gui_set_player_cards(carda, cardb, n, (show_folded) || (players[n].cardsvisible) );
}

function make_readable_rank (r) {
 /* if (r < 11) {
    return r;
  } else if (r == 11) {
    return "J";
  } else if (r == 12) {
    return "Q";
  } else if (r == 13) {
    return "K";
  } else if (r == 14) {
    return "A";
  }*/
}

function get_pot_size_client() {
  /*var p = 0;
  for (var i = 0; i < players.length; i++) {
    p += players[i].total_bet + players[i].subtotal_bet;
  }*/
  return pot_size;
}




function reset_player_statuses_client(type) {
  for (var i = 0; i < players.length; i++) {
    if (type == 0) {
      players[i].status = "";
    } else if (type == 1 && players[i].status != "BUST") {
      players[i].status = "";
    } else if (type == 2 &&
               players[i].status != "FOLD" &&
               players[i].status != "BUST") {
      players[i].status = "";
    }
  }
}



function write_settings_frame_client () {
  var default_speed = 2;
  var speed_i = getLocalStorage("gamespeed");
  if (speed_i == "") {
    speed_i = default_speed;
  }
  if (speed_i == null ||
      (speed_i != 0 &&
       speed_i != 1 &&
       speed_i != 2 &&
       speed_i != 3 &&
       speed_i != 4)) {
    speed_i = default_speed;
  }
  set_speed(speed_i);
  gui_setup_option_buttons(moveTable)/*
                           set_raw_speed,
                           help_func,
                           update_func,
                           gui_toggle_the_theme_mode);*/
}



function start_game_client()
{
  write_settings_frame_client();
   var container = document.querySelector('#jitsi-container');
   var domain = "beta.meet.jit.si";
    var options = {
        "roomName": localStorage.pokerRoomName,
        "parentNode": container,
        "width": 900,
        "height": 600,
	"openBridgeChannel": true 
    };
    api = new JitsiMeetExternalAPI(domain, options);
	setTimeout(api.executeCommand('toggleTileView'),1000);
	api.addEventListener('endpointTextMessageReceived', text_listener_client); 
	if(localStorage.whoami!=undefined)
	sendAllParticipants("I am-"+localStorage.whoami+"-"+getLocalStorage("playername"));
  //gui_write_modal_box("");

}
function text_listener_client(data){
	var obj=JSON.parse(JSON.stringify(data));
	var txt=obj.data.eventData.text;
	if(!txt.includes("I am"))
	{
		if(server=="")
			document.getElementById("game-response").innerHTML="Waiting for the host to start";
		server= obj.data.senderInfo.id;
		
	}
	//alert(server);
	if(JSON.stringify(data).includes("status"))
	{
		var myplayer=JSON.parse(txt)
		players[myplayer.number]=myplayer;
		write_player_client(myplayer.number, myplayer.hilite, myplayer.number==whoami);
	}
	//alert("got text data: " + obj.data.eventData.text)
	if(txt.includes("Game starting")||txt.includes("Rejoining"))
	{
		//document.getElementById("setup-options").style.display="none";
		whoami=obj.data.eventData.text.split("-")[1];
		localStorage.setItem("whoami",whoami)
		/*if(txt.includes("Game starting"))
			send("I am-"+whoami+"-"+getLocalStorage("playername"));*/
		handle_how_many_reply_client() 
	}
	if(txt.includes("Turn"))
		if(txt.split("-")[1]==whoami)
		{
			var x = document.getElementById("beep"); 
			x.play();
			actions_client()
		}
		else
		{
			gui_hide_fold_call_click();
			gui_hide_guick_raise();
			
		}
	if(txt.includes("LayCard"))
	{
		var current_pos=txt.split("-")[1];
		var value=txt.split("-")[2];
	   gui_lay_board_card(parseInt(current_pos),value);
	//ShowCard-"+current_pos+"-"+board[current_pos]	
	}
	/*if(txt.includes("cardsvisible-"))
	{
		var n=txt.split("-")[1];
			players[parseInt(n)].cardsvisible=true;
			write_player_client(parseInt(n),0,1);
		}*/
	if(txt.includes("big_blind"))
	{
		BIG_BLIND=parseInt(txt.split("-")[1])
	}
	if(JSON.stringify(data).includes("to_call"))
	{
		
		var data=JSON.parse(txt)
		to_call=data.to_call;
		current_bet_amount=data.current_bet_amount;
		/*pot_size=data.pot_size;
		var hi_lite_color = gui_get_theme_mode_highlite_color();
		  var html = "<html><body topmargin=2 bottommargin=0 bgcolor=" + BG_HILITE +
             " onload='document.f.c.focus();'><table><tr><td>" +
             get_pot_size_html() +
             "</td></tr></table><br><font size=+2 color=" + hi_lite_color +
             "><b>Winning: " +
             winner_text + "</b></font>" + detail + "<br>";
		gui_write_game_response(html);
		write_player_client(myplayer.number, myplayer.hilite, myplayer.number==whoami);*/
	}
	
	if(txt.includes("Youreserver"))
	{
		alert("About to become host")
		var oldServer=players[0];
		oldServer.number=parseInt(whoami);
		players[parseInt(whoami)].number=0;
		players[0]=players[parseInt(whoami)];
		players[parseInt(whoami)]=oldServer;
		localStorage.setItem("players",JSON.stringify(players));
		send("newserver");
		setTimeout(function() {window.location.href="poker.html"},2000)
	}
	if(txt.includes("game_response"))
	{
		var message=txt.split("-")[1]
		gui_write_game_response(message);
	}
	if(txt.includes("basic general"))
	{
		var message=txt.split("-")[1]
		gui_write_basic_general(message);
	}
		if(txt.includes("Whoareyou"))
		{
			send("I am-"+localStorage.whoami+"-"+getLocalStorage("playername"));
		}
		if(txt.includes("gui_place_dealer_button"))
		{
			gui_place_dealer_button(parseInt(txt.split("-")[1]))
		}
		if(txt.includes("Areyouplaying"))
			send("Iamplaying")
	if (txt.includes("Endofhand"))	
	{		
		  var quit_text = "Show my cards";
		var quit_func =  showCards_client;
		var continue_text = "Finish hand";
		var continue_func = showWinners_client;
		gui_setup_fold_call_click(quit_text,continue_text,quit_func,continue_func);
	}
	if (txt.includes("Newhand"))	
	{
		var continue_text = "New hand";
		var continue_func = new_hand;
		gui_setup_fold_call_click(continue_text,0,continue_func,continue_func);
	}
}

function new_hand()//LEAVE IN
{send("StartNewhand");}
function showWinners_client()//LEAVE IN
{
	send("showWinners");
}

function send(command)//LEAVE IN
{
   api.executeCommand('sendEndpointTextMessage',server,command);
}


///////////////////////////////////////////////////////////////////////////////////////////// gui_if.js
"use strict";

//  --- Not in the interface ---

function internal_get_a_class_named (curr, searched_name) {
  if (!curr) {
    gui_log_to_history("internal_get_a_class_named, no curr for " +
                       searched_name);
  }
  var notes = null;
  for (var i = 0; i < curr.childNodes.length; i++) {
    if (curr.childNodes[i].className === searched_name) {
      notes = curr.childNodes[i];
      break;
    }
  }
  return notes;
}

function internal_FixTheRanking (rank) {
  var ret_rank = 'NoRank';
  if (rank === 14) {
    ret_rank = 'ace';
  } else if (rank === 13) {
    ret_rank = 'king';
  } else if (rank === 12) {
    ret_rank = 'queen';
  } else if (rank === 11) {
    ret_rank = 'jack';
  } else if (rank > 0 && rank < 11) {
    // Normal card 1 - 10
    ret_rank = rank;
  } else {
    console.log(typeof rank);
    alert('Unknown rank ' + rank);
  }
  return ret_rank;
}

function internal_FixTheSuiting (suit) {
  if (suit === 'c') {
    suit = 'clubs';
  } else if (suit === 'd') {
    suit = 'diamonds';
  } else if (suit === 'h') {
    suit = 'hearts';
  } else if (suit === 's') {
    suit = 'spades';
  } else {
    alert('Unknown suit ' + suit);
    suit = 'yourself';
  }
  return suit;
}

function internal_GetCardImageUrl (card) {
  var suit = card.substring(0, 1);
  var rank = parseInt(card.substring(1));
  rank = internal_FixTheRanking(rank); // 14 -> 'ace' etc
  suit = internal_FixTheSuiting(suit); // c  -> 'clubs' etc

  return "url('static/images/" + rank + "_of_" + suit + ".png')";
}

function internal_setBackground (diva, image, opacity) {
  var komage = diva.style;
  komage.opacity = opacity;
  komage['background-image'] = image;
}

function internal_setCard (diva, card, folded) {
  // card may be "" -> do not show card
  //             "blinded" -> show back
  //             "s14" -> show ace of spades
  var image;
  var opacity = 1.0;
  if (typeof card === 'undefined') {
    alert('Undefined card ' + card);
    image = "url('static/images/outline.gif')";
  } else if (card === "") {
    image = "url('static/images/outline.gif')";
  } else if (card === "blinded") {
    image = "url('static/images/cardback.png')";
  } else {
    if (folded) {
      opacity = 0.5;
    }
    image = internal_GetCardImageUrl(card);
  }
  internal_setBackground(diva, image, opacity);
}

function internal_clickin_helper (button, button_text, func_on_click) {
  if (button_text === 0) {
    button.style.visibility = 'hidden';
  } else {
    button.style.visibility = 'visible';
    button.innerHTML = button_text;
    button.onclick = func_on_click;
  }
}

//  --- here is the GUI stuff ---

function gui_hide_poker_table () {
  var table = document.getElementById('poker_table');
  table.style.visibility = 'hidden';
}

function gui_show_poker_table () {
  var table = document.getElementById('poker_table');
  table.style.visibility = 'visible';
}

function gui_set_player_name (name, seat) {
  var table = document.getElementById('poker_table');
  var current = 'seat' + seat;
  var seatloc = table.children[current];
  var chipsdiv = internal_get_a_class_named(seatloc, 'name-chips');
  var namediv = internal_get_a_class_named(chipsdiv, 'player-name');
  if (name === "") {
    seatloc.style.visibility = 'hidden';
  } else {
    seatloc.style.visibility = 'visible';
  }
  namediv.textContent = name;
}

function gui_hilite_player (hilite_color, name_color, seat) {
  var table = document.getElementById('poker_table');
  var current = 'seat' + seat;
  var seatloc = table.children[current];
  var chipsdiv = internal_get_a_class_named(seatloc, 'name-chips');
  //  var chipsdiv = seatloc.getElementById('name-chips');
  var namediv = internal_get_a_class_named(chipsdiv, 'player-name');
  if (name_color === "") {
    namediv.style.color = chipsdiv.style.color;
  } else {
    namediv.style.color = name_color;
  }
  if (hilite_color === "") {
    namediv.style.backgroundColor = chipsdiv.style.backgroundColor;
  } else {
    namediv.style.backgroundColor = hilite_color;
  }
}

function gui_set_bankroll (amount, seat) {
  var table = document.getElementById('poker_table');
  var current = 'seat' + seat;
  var seatloc = table.children[current];
  var chipsdiv = internal_get_a_class_named(seatloc, 'name-chips');
  //  var chipsdiv = seatloc.getElementById('name-chips');
  var namediv = internal_get_a_class_named(chipsdiv, 'chips');
  if (!isNaN(amount) && amount != "") {
    amount = "$" + amount;
  }
  namediv.textContent = amount;
}

function gui_set_bet (bet, seat) {
  var table = document.getElementById('poker_table');
  var current = 'seat' + seat;
  var seatloc = table.children[current];
  var betdiv = internal_get_a_class_named(seatloc, 'bet');

  betdiv.textContent = bet;
}

function gui_set_player_cards (card_a, card_b, seat, folded) {
  var table = document.getElementById('poker_table');
  var current = 'seat' + seat;
  var seatloc = table.children[current];
  var cardsdiv = internal_get_a_class_named(seatloc, 'holecards');
  var card1 = internal_get_a_class_named(cardsdiv, 'card holecard1');
  var card2 = internal_get_a_class_named(cardsdiv, 'card holecard2');

  internal_setCard(card1, card_a, folded);
  internal_setCard(card2, card_b, folded);
}

function gui_lay_board_card (n, the_card) {
  // Write the card no 'n'
  // the_card = "c9";

  var current = '';

  if (n === 0) {
    current = 'flop1';
  } else if (n === 1) {
    current = 'flop2';
  } else if (n === 2) {
    current = 'flop3';
  } else if (n === 3) {
    current = 'turn';
  } else if (n === 4) {
    current = 'river';
  }

  var table = document.getElementById('poker_table');
  var seatloc = table.children.board;

  var cardsdiv = seatloc.children[current];
  internal_setCard(cardsdiv, the_card);
}

function gui_burn_board_card (n, the_card) {
  // Write the card no 'n'
  // the_card = "c9";

  var current = '';

  if (n === 0) {
    current = 'burn1';
  } else if (n === 1) {
    current = 'burn2';
  } else if (n === 2) {
    current = 'burn3';
  }

  var table = document.getElementById('poker_table');
  var seatloc = table.children.board;

  var cardsdiv = seatloc.children[current];
  internal_setCard(cardsdiv, 'blinded');
}

function gui_write_basic_general (pot_size) {
  var table = document.getElementById('poker_table');
  var pot_div = table.children.pot;
  var total_div = pot_div.children['total-pot'];

  var the_pot = 'Total pot: ' + pot_size;
  total_div.innerHTML = the_pot;
}

function gui_write_basic_general_text (text) {
  var table = document.getElementById('poker_table');
  var pot_div = table.children.pot;
  var total_div = pot_div.children['total-pot'];
  total_div.style.visibility = 'visible';
  total_div.innerHTML = text;
}

var log_text = [];
var log_index = 0;

function gui_log_to_history (text_to_write) {
  for (var idx = log_index; idx > 0; --idx) {
    log_text[idx] = log_text[idx - 1];
  }

  log_text[0] = text_to_write;
  if (log_index < 40) {
    log_index = log_index + 1;
  }
  var text_to_output = '<br><b>' + log_text[0] + '</b>';
  for (idx = 1; idx < log_index; ++idx) {
    text_to_output += '<br>' + log_text[idx];
  }
  var history = document.getElementById('history');
  history.innerHTML = text_to_output;
}

function gui_hide_log_window () {
  var history = document.getElementById('history');
  //  history.style.visibility = 'hidden';
  history.style.display = 'none';
}

function gui_place_dealer_button (seat) {
  var table_seat = seat; // interface start at 1
  var button = document.getElementById('button');
  if (seat < 0) {
    button.style.visibility = 'hidden';
  } else {
    button.style.visibility = 'visible';
  }
  button.className = 'seat' + table_seat + '-button';
}

function gui_hide_dealer_button () {
  gui_place_dealer_button(-3);
}

function gui_hide_fold_call_click () {
  var buttons = document.getElementById('action-options');
  var fold = buttons.children['fold-button'];
  internal_clickin_helper(fold, 0, 0);

  var call = buttons.children['call-button'];
  internal_clickin_helper(call, 0, 0);
  gui_disable_shortcut_keys();
}

function gui_setup_fold_call_click (show_fold, call_text,
  fold_func, call_func, key_ev) {
  // Here we have a coupling of the functions 'human_fold' and 'human_call'
  var buttons = document.getElementById('action-options');
  var fold = buttons.children['fold-button'];
  internal_clickin_helper(fold, show_fold, fold_func);

  var call = buttons.children['call-button'];
  internal_clickin_helper(call, call_text, call_func);
}

function curry_in_speedfunction (speed_func) {
  var call_back = speed_func;

  var ret_func = function () {
    var buttons = document.getElementById('setup-options');
    var speed = buttons.children['speed-button'];
    var selector = speed.children['speed-selector'];
    var qqq = selector.children['speed-options'];
    var index = qqq.value;
    var value = qqq[index].text;

    call_back(value);
  };
  return ret_func;
}

function gui_set_selected_speed_option (index) {
  /*var buttons = document.getElementById('setup-options');
  var speed = buttons.children['speed-button'];
  var selector = speed.children['speed-selector'];
  var qqq = selector.children['speed-options'];
  qqq.value = index;*/
}

function internal_le_button (buttons, button_name, button_func) {
  var le_button = buttons.children[button_name];
  le_button.style.visibility = 'visible';
  le_button.onclick = button_func;
}

function gui_setup_option_buttons (name_func,
                                   help_func) {
  var buttons = document.getElementById('setup-options');

  internal_le_button(buttons, 'name-button', name_func);
  internal_le_button(buttons, 'help-button', help_func);
  /*var speed = buttons.children['speed-button'];
  speed.style.visibility = 'visible';
  speed.onchange = curry_in_speedfunction(speed_func);*/

  //internal_le_button(buttons, 'mode-button', mode_func);
}

function internal_hide_le_button (buttons, button_name, button_func) {
  var le_button = buttons.children[button_name];
  le_button.style.visibility = 'hidden';
}

function gui_hide_setup_option_buttons (name_func,
                                        //speed_func,
                                        help_func) {
  var buttons = document.getElementById('setup-options');

  internal_hide_le_button(buttons, 'name-button');
  internal_hide_le_button(buttons, 'help-button');
}

function gui_hide_game_response () {
  var response = document.getElementById('game-response');
  response.style.visibility = 'hidden';
}

function gui_show_game_response () {
  var response = document.getElementById('game-response');
  response.style.visibility = 'visible';
}

function gui_write_game_response (text) {
  var response = document.getElementById('game-response');
  response.innerHTML = text;
}

function gui_set_game_response_font_color (color) {
  var response = document.getElementById('game-response');
  response.style.color = color;
}

function gui_write_guick_raise (text) {
  var response = document.getElementById('quick-raises');
  if (text === "") {
    response.style.visibility = 'hidden';
  } else {
    response.style.visibility = 'visible';
    response.innerHTML = text;
  }
}

function gui_hide_guick_raise () {
  gui_write_guick_raise("");
}

function gui_write_modal_box (text) {
  var modal = document.getElementById('modal-box');
  if (text === "") {
    modal.style.display = "none";
  } else {
    modal.innerHTML = text;
    modal.style.display = "block";
    modal.style.opacity = "0.90";
  }
}

function gui_initialize_css () {
  // Set all the backgrounds
  //var image;
  //var item;
  //item = document.getElementById('poker_table');
  //image = "url('static/images/poker_table.png')";
  //internal_setBackground(item, image, 1.0);
}

function gui_enable_shortcut_keys (func) {
  document.addEventListener('keydown', func);
}

function gui_disable_shortcut_keys (func) {
  document.removeEventListener('keydown', func);
}

// Theme mode
function internal_get_theme_mode () {
  var mode = "night";/*getLocalStorage("currentmode");
  if (mode === null) {  // first time
    mode = "light";
  }*/
  return mode;
}

function internal_set_theme_mode (mode) {
  setLocalStorage("currentmode", mode);
}

function gui_set_production_code_font_color (color) {
  //var response = document.getElementById('production-code');
  //response.style.color = color;
}

function internal_get_into_the_mode (mode) {
	var color = '#090909';
    var button_text = 'Light mode';
    gui_set_game_response_font_color('white');
    gui_set_production_code_font_color('white');
	document.body.style.backgroundColor = color;
  /*var buttons = document.getElementById('setup-options');
  var mode_button = buttons.children['mode-button'];

  var color;
  var button_text;
  if (mode == "dark") {
    color = 'DimGray';
    button_text = 'Darker';
  } else if (mode == "darker") {
    color = '#393939';
    button_text = 'High contrast';
  } else if (mode == "night") {
    color = '#090909';
    button_text = 'Light mode';
    gui_set_game_response_font_color('white');
    gui_set_production_code_font_color('white');
    } else {
    color = 'White';
    button_text = 'Dark mode';
    gui_set_game_response_font_color('black');
    gui_set_production_code_font_color('black');
}
  document.body.style.backgroundColor = color;
  mode_button.innerHTML = button_text;*/
}

function gui_initialize_theme_mode () {
  var mode = "night"; //internal_get_theme_mode();
  internal_get_into_the_mode(mode);
  internal_set_theme_mode(mode);
}

function gui_toggle_the_theme_mode () {
  var mode = internal_get_theme_mode();
  if (mode == "dark") {
    mode = "darker";
  } else if (mode == "darker") {
    mode = "night";
  } else if (mode == "night") {
    mode = "light";
  } else {
    mode = "dark";
  }
  internal_get_into_the_mode(mode);
  internal_set_theme_mode(mode);
}

function gui_get_theme_mode_highlite_color () {
  var mode = internal_get_theme_mode();
  var color = "yellow";
  if (mode == "light") {
    color = "red";
  }
  return color;
}

