<?php

    ob_start();	

    // define variables and set to empty values
    $completed = $occ = $move = $comp = $dgoal = $mgoal = "";
    
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
      $completed = $_POST["completed"];
      $comp = $_POST["comp"];
      $move = $_POST["move"];
      $occ = $_POST["occ"];
      $mgoal = $_POST["mgoal"];
      $dgoal = $_POST["dgoal"];
    }

   if(($completed != "yes" && $completed != "no") 
      || ($occ != "yes" && $occ != "no") 
      ||  ($move != "yes" && $move != "no") 
      ||  ($mgoal != "yes" && $mgoal != "no") 
      || ($comp != "yes" && $comp != "no") 
      || ($dgoal != "yes" && $dgoal != "no")){
     echo 'a';//'<meta http-equiv="refresh" content="0;url=web.stanford.edu/~rxdh/psych254/replication_project/forms/fail.html">';
    } else {
      if ($completed == "yes") {
	echo 'a'//'<meta http-equiv="refresh" content="0;url=web.stanford.edu/~rxdh/psych254/replication_project/forms/notwice.html">';
      } else {
	if ($occ == "no" || $move  == "no" || $mgoal == "no" || $dgoal == "no" || $comp == "no") {
	  echo 'a'//'<meta http-equiv="refresh" content="0;url=web.stanford.edu/~rxdh/psych254/replication_project/forms/fail.html">';
	} else {
	  echo 'a'//'<meta http-equiv="refresh" content="0;url=web.stanford.edu/~rxdh/psych254/replication_project/forms/pass.html">';
	}
      }
    }
?>
