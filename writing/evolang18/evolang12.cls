%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% evolang12.cls      :   08-05-20012
%%
%% Class file for Evolang 12 Proceedings.
%% Based on World Scientific Publishing's ws-procs9x6.cls (2006)
%%
%% Proceedings Trim Size: 9in x 6in
%% Text Area: 7.35in (include runningheads) x 4.5in
%% Main Text is 10/13pt					  
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% Captions:
%%   use \caption{} for captions in figures.
%%   use \tablecaption{} for captions in tables.

\NeedsTeXFormat{LaTeX2e}
\LoadClass[a4paper,10pt,onecolumn]{article}
\ProvidesClass{evolang11}[2009/03/06 v1]

\pagestyle{empty}

\newdimen\trimheight
\newdimen\trimwidth
\newdimen\typeheight
\newdimen\typewidth
\newdimen\tempdimen
\newdimen\tablewidth
\newdimen\normaltextheight
\newbox\tempbox
\newdimen\tablewd

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Fonts %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
\def\foliofont{\fontsize{8}{10}\selectfont}
\def\bibfont{\fontsize{9}{11}\selectfont}
\def\rhfont{\footnotesize\itshape{}}
\def\catchlinefont{\footnotesize}
\def\titlefont{\fontsize{10}{13}\bfseries\boldmath\selectfont\centering{}}
\def\authorfont{\footnotesize}
\def\abstractfont{\footnotesize}
\def\addressfont{\small\itshape{}}
\let\affiliationfont\rhfont
\def\datefont{\footnotesize}
\def\sectionfont{\bfseries\boldmath\rightskip2pc plus1fill{}}
\def\subsectionfont{\bfseries\boldmath\itshape\rightskip2pc plus1fill{}}
\def\subsubsectionfont{\itshape\rightskip2pc plus1fill{}}
\def\paragraphfont{\bfseries\boldmath}
\def\subparagraphfont{\itshape}
\def\figurecaptionfont{\footnotesize}
\def\tablefont{\footnotesize}
\def\tablecaptionfont{\footnotesize}
\def\foot{\small}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%Initializations %%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
\newdimen\trimheight \trimheight9truein
\newdimen\trimwidth \trimwidth6truein
\newdimen\typeheight \typeheight7.35in
%

%
\setlength\parindent{15pt}
\setlength\headheight{8\p@} %{5\p@}
\setlength\headsep   {19\p@} %{.25in}
\setlength\topskip   {7\p@}
\setlength\footskip{0.17in}%{10pt}
\setlength\maxdepth{4\p@}
\setlength\@maxdepth\maxdepth
\setlength\textwidth{4.5in}
\setlength\textheight\typeheight
\advance\textheight-\headheight
\advance\textheight-\headsep
\setlength\normaltextheight{\textheight}
\setlength\oddsidemargin{19mm}
\setlength\evensidemargin{\trimwidth}
\addtolength\evensidemargin{-\textwidth}
\addtolength\evensidemargin{-\oddsidemargin}
\setlength\marginparwidth{.75in}
\setlength\marginparsep{7\p@}
\setlength\marginparpush{5\p@}
\setlength\topmargin{0.54in}
\setlength\footnotesep{6\p@} %6pt
\setlength{\skip\footins}{18\p@ \@plus 5\p@ \@minus 2\p@}
\setlength\floatsep    {18\p@ \@plus 2\p@ \@minus 2\p@}
\setlength\textfloatsep{18\p@ \@plus 2\p@ \@minus 4\p@}
\setlength\intextsep   {18\p@ \@plus 2\p@ \@minus 2\p@}
\setlength\dblfloatsep    {18\p@ \@plus 2\p@ \@minus 2\p@}
\setlength\dbltextfloatsep{18\p@ \@plus 2\p@ \@minus 4\p@}
\setlength\@fptop{0\p@}
\setlength\@fpsep{8\p@ \@plus 2fil}
\setlength\@fpbot{0\p@ \@plus 1fil}
\setlength\@dblfptop{0\p@ \@plus 1fil}
\setlength\@dblfpsep{8\p@ \@plus 2fil}
\setlength\@dblfpbot{0\p@ \@plus 1fil}
\setlength\partopsep{0\p@}
%
\setlength\lineskip{1\p@}
\setlength\normallineskip{1\p@}%
\renewcommand\baselinestretch{}%{}
\setlength\parskip{0\p@}
\@lowpenalty   51
\@medpenalty  151
\@highpenalty 301
\@beginparpenalty -\@lowpenalty
\@endparpenalty   -\@lowpenalty
\@itempenalty     -\@lowpenalty

%
%%%%%%%%%%%%%%%%%%%%%%%%%%%Title %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%

\def\title#1{\gdef\@title{{\uppercase{#1}}}}
\renewcommand\maketitle{\par
  \begingroup
   \renewcommand\thefootnote{\@fnsymbol\c@footnote}%
    \def\@makefnmark{\rlap{\@textsuperscript{\normalfont\@thefnmark}}}%
    \long\def\@makefntext##1{\noindent
   	\@textsuperscript{\normalfont\@thefnmark}{\lowercase{##1}}}%
      \newpage
      \global\@topnum\z@
      \@maketitle
    \thispagestyle{empty}\@thanks
  \endgroup
  \setcounter{footnote}{0}%
  \global\let\thanks\relax
  \global\let\maketitle\relax
  \global\let\@maketitle\relax
  \global\let\@thanks\@empty
  \global\let\@author\@empty
  \global\let\@title\@empty
  \global\let\title\relax
  \global\let\author\relax
}


\def\@maketitle{%
  \newpage
  \null
  \vspace*{-10pt}
   \vspace*{-25pt}% to have the bylines on the beginning of the page
  \@clinebuf
  \vspace*{52pt}
  \begin{center}%
  \let\footnote \thanks 
  {\titlefont\@title \par}%
    \vspace*{20pt}
  {\authorfont\@author \par}
  \vspace*{20pt}
  \@aabuffer\par
  \end{center}%
}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% End Title %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
%
\def\mtb{\fboxsep=0pt\fbox{\phantom{e}}}
\def\breakhere{\par\vskip-\lastskip
			\pagebreak}
\def\forcebreak{\vadjust{\pagebreak}}
%

\def\thebepage{\thepage}
\def\theeepage{\pageref{eof}}

\def\pub#1#2#3{\par%	
	\addvspace{-2pt plus-2pt minus-2pt}
	{\centering{
	\authorfont #1\par
	#2\par
	#3\par}\par}	
	\addvspace{15pt plus2pt minus2pt}}%
%
\def\@clinebuf{}
\def\catchline#1#2#3{\expandafter\def\expandafter\@clinebuf\expandafter
	{\@clinebuf\catchlinefont
	\noindent Proceedings\par
	\noindent Vol.\ {#1}, \No\ {#2} (#3)\ \thebepage--\theeepage\par
	\noindent \copyright\ World Scientific Publishing Company\par
	}\relax\par
	}%

\def\No{No.}
%
%\def\and{\hbox{\lowercase{ and }}}
\def\and{\hbox{\lowercase{and }}} 
\def\aand{\\[10pt]{\upshape{and}}\\[-3pt]}
\def\@aabuffer{}
\def\author#1{\expandafter\def\expandafter\@aabuffer\expandafter
	{\@aabuffer{\small{{\uppercase{#1}}}}\relax\par
	\vspace*{3pt}}}

\def\address#1{\expandafter\def\expandafter\@aabuffer\expandafter
	{\@aabuffer{\addressfont{#1\par}\par}\relax\par
	\vspace*{13pt}}}
%
\def\keywords#1{\par
	\vspace*{8pt}
	{\authorfont{\leftskip18pt\rightskip\leftskip
	\noindent{\it Keywords}\/:\ #1\par}}\par}
%
\def\category#1#2{\par
	\vspace*{8pt}
	{\authorfont{\leftskip18pt\rightskip\leftskip
	\noindent{\it Categories}\/:\ #1:\ #2\par}}\par}
%
\def\abstracts#1{
\begin{center}
{\begin{minipage}{4.2truein}
                 \footnotesize
                 \parindent=0pt #1\par
                 \end{minipage}}\end{center}
                 \vskip 2em \par}


%%%%%%%%%%%%%%%%%%%%%%%%%%%% Sections %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%
\renewcommand\section{\@startsection{section}{1}{\z@}{-12pt \@plus-3pt minus-6pt}{6pt}{\sectionfont}}
\renewcommand\subsection{\@startsection{subsection}{2}{\z@}{-12pt \@plus-3pt minus-6pt}{6pt}{\subsectionfont}}
\renewcommand\subsubsection{\@startsection{subsubsection}{3}{\z@}{-12pt \@plus-3pt minus-3pt}{6pt}{\subsubsectionfont}}
\renewcommand\paragraph{\@startsection{paragraph}{4}{\z@}{12pt \@plus -3pt}{-.5em}{\paragraphfont}}
\renewcommand\subparagraph{\@startsection{subparagraph}{5}{\parindent}{3.25ex \@plus1ex}{-1em}{\subparagraphfont}}
%
\def\@seccntformat#1{{\upshape{\csname the#1\endcsname.}}\hskip .5em}
%
\gdef\@author{}
%

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Floats %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
\setcounter{topnumber}{3}
\def\topfraction{.98}
\setcounter{bottomnumber}{3}
\def\bottomfraction{.98}
\setcounter{totalnumber}{6}%4
\def\textfraction{.01}
\def\floatpagefraction{.98100}
\setcounter{dbltopnumber}{2}
\def\dbltopfraction{.981}
\def\dblfloatpagefraction{.99}
%
%
%\newlength\abovecaptionskip
%\newlength\belowcaptionskip
\setlength\abovecaptionskip{6\p@}% plus3pt minus3pt}
\setlength\belowcaptionskip{-1\p@}
%
\def\FigName{figure}%
%
%\InputIfFileExists{psfig.sty}{}{}
%\InputIfFileExists{epsf.sty}{}{}
\newbox\captionbox
%

\long\def\@makecaption#1#2{%
  \ifx\FigName\@captype
    	\vskip\abovecaptionskip
 	\setbox\captionbox\hbox{%
	{\figurecaptionfont#1\unskip\ignorespaces\hskip1em#2\par}}
	\ifdim\wd\captionbox>\hsize
	{\figurecaptionfont#1\unskip\ignorespaces\hskip1em#2\par}\par
	\else
	\centerline{\figurecaptionfont#1\unskip\ignorespaces\hskip1em#2}\par
	\fi\else\global\setbox\captionbox\hbox{%
	{\tablecaptionfont#1\ignorespaces\hskip1em#2\par}}
	\fi
}
%
\def\figurename{Figure}
%\newcounter{figure}
\renewcommand\thefigure{\@arabic\c@figure}
\def\fps@figure{htbp}
\def\ftype@figure{1}
\def\ext@figure{lof}
\def\fnum@figure{\figurename~\thefigure.}  %Figure 1
\renewenvironment{figure}
               {\@float{figure}}
               {\end@float}
\renewenvironment{figure*}
               {\@dblfloat{figure}}
               {\end@dblfloat}
%
\def\ArtDir{\jobname/}
\def\figurebox#1#2#3{%
        \def\arg{#3}%
        \ifx\arg\empty
        {\hfill\vbox{\hsize#2\hrule\hbox to #2{%
                \vrule\hfill\vbox to #1{\hsize#2\vfill}\vrule}\hrule}\hfill}%
        \else
        \hbox to \hsize{\hfill\epsfbox{\ArtDir#3.eps}\hfill}
        \fi}
%
\def\PSFIG#1#2#3{\par
  {\hbox to \hsize{%
	\hfill{\psfig{file=\ArtDir#1.eps,width=#2,angle=#3}}\hfill}\par}}%
%
%\newcounter{table}
\def\tablename{\upshape Table}
\renewcommand\thetable{\@arabic\c@table}
\def\fps@table{htbp}
\def\ftype@table{2}
\def\ext@table{lot}
\def\fnum@table{\tablename~\thetable.}  %Table 1.
\renewenvironment{table}
               {\@float{table}}
               {\end@float}
\renewenvironment{table*}
               {\@dblfloat{table}}
               {\end@dblfloat}
%
\long\def\tablecaption#1#2{%
	\parindent\z@\ignorespaces\noindent\tablecaptionfont
	\caption{#1}%
  	\par\setbox\tempbox\hbox{\tablefont #2}%
  	\tablewd\hsize\advance\tablewd-\wd\tempbox\global\divide\tablewd\tw@
	\ifdim\wd\captionbox<\wd\tempbox\centerline{\unhbox\captionbox}
	\else\leftskip\tablewd\rightskip\leftskip{\unhbox\captionbox}\par
	\fi\vskip5pt\centerline{\box\tempbox}
}%
%
\long\def\ttbl#1#2#3{%
	\parindent\z@
	\noindent
  	\tablecaptionfont
	\caption{#2}%
	\tablewd\hsize
	\advance\tablewd-#1
  	\global\divide\tablewd\tw@
	\ifdim \wd\captionbox<#1
	\centerline{\unhbox\captionbox}
	\else
  	{\leftskip\tablewd% plus1fill{}
	\rightskip\tablewd% plus1fill{}
  	\unhbox\captionbox\par}
	\fi
 	\vskip-8pt
	\centerline{#3}
}%
%
\newenvironment{InTextTable}{%
 	\par\addvspace{16pt plus6pt minus6pt}%
 	\begin{center}\tablecaptionfont\noindent\ignorespaces
}{%
   	\end{center}\par\addvspace{17pt plus6pt minus6pt}}
%
\newenvironment{tabnote}{%
	\par\vskip5pt\footnotesize%
	\@ifnextchar[{\@tabnote}{\@tabnote[Note]}}{%
	\par\vskip-5pt}
\def\@tabnote[#1]{%
	\leftskip\tablewd\rightskip\leftskip {\it #1}\/:\ \ignorespaces}
%
\def\x{@{\extracolsep{\fill}}}
\def\toprule{\\[-6pt]\hline\\[-5.5pt]}
\def\colrule{\\[-7.5pt]\hline\\[-5.5pt]}
\def\botrule{\\[-7pt]\hline\\[-8.5pt]}
\def\crule#1{\\[-6pt]\cline{#1}\\[-6.5pt]}
%

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Footnote %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
%\def\thefootnote{\alph{footnote}}
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Appendices %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\renewcommand\appendixname{Appendix}
\newcounter{appendix}
\renewcommand\appendix{\par
  	\refstepcounter{appendix}
	\setcounter{section}{0}%
	\renewcommand\thesection{\appendixname\ \Alph{section}}}%
%

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Process Options %%%%%%%%%%%%%%%%%%%%%%%%
%
\def\sloppy{\tolerance=100000\hfuzz=\maxdimen\vfuzz=\maxdimen}
\vbadness=12000
\hbadness=12000
\sloppy
\usepackage{apacite}
\usepackage{times}
\usepackage{amsfonts}
\usepackage{amssymb,amsmath}
\onecolumn
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% End of file %%%%%%%%%%%%%%%%%%%%%%%%%%%%




