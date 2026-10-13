CREATE TABLE public.questions (
  id serial PRIMARY KEY,
  kind text NOT NULL,
  category text NOT NULL,
  prompt text NOT NULL,
  options text[] NOT NULL,
  answer text,
  images text[],
  audio text
);
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are public" ON public.questions FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL DEFAULT 'Hráč',
  score int NOT NULL,
  total int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT score_range CHECK (score >= 0 AND total > 0 AND total <= 200 AND score <= total),
  CONSTRAINT name_len CHECK (char_length(player_name) BETWEEN 1 AND 30)
);
GRANT SELECT, INSERT ON public.quiz_results TO anon, authenticated;
GRANT ALL ON public.quiz_results TO service_role;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read results" ON public.quiz_results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add results" ON public.quiz_results FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TEMP TABLE words (n serial, word text, cz text, emoji text);
INSERT INTO words (word, cz, emoji) VALUES
('dog','pes','🐶'),('cat','kočka','🐱'),('horse','kůň','🐴'),('cow','kráva','🐮'),('pig','prase','🐷'),
('rabbit','králík','🐰'),('mouse','myš','🐭'),('bear','medvěd','🐻'),('lion','lev','🦁'),('tiger','tygr','🐯'),
('monkey','opice','🐵'),('elephant','slon','🐘'),('frog','žába','🐸'),('fish','ryba','🐟'),('bird','pták','🐦'),
('snake','had','🐍'),('turtle','želva','🐢'),('bee','včela','🐝'),('butterfly','motýl','🦋'),('spider','pavouk','🕷️'),
('apple','jablko','🍎'),('banana','banán','🍌'),('grapes','hrozny','🍇'),('strawberry','jahoda','🍓'),('lemon','citron','🍋'),
('cherry','třešeň','🍒'),('carrot','mrkev','🥕'),('potato','brambora','🥔'),('tomato','rajče','🍅'),('bread','chléb','🍞'),
('cheese','sýr','🧀'),('egg','vejce','🥚'),('milk','mléko','🥛'),('cake','dort','🎂'),('ice cream','zmrzlina','🍦'),
('pizza','pizza','🍕'),('house','dům','🏠'),('school','škola','🏫'),('car','auto','🚗'),('bus','autobus','🚌'),
('train','vlak','🚆'),('plane','letadlo','✈️'),('bike','kolo','🚲'),('ship','loď','🚢'),('book','kniha','📖'),
('pencil','tužka','✏️'),('clock','hodiny','🕰️'),('phone','telefon','📱'),('computer','počítač','💻'),('key','klíč','🔑'),
('chair','židle','🪑'),('bed','postel','🛏️'),('door','dveře','🚪'),('umbrella','deštník','☂️'),('ball','míč','⚽'),
('guitar','kytara','🎸'),('hat','klobouk','🎩'),('shoe','bota','👟'),('shirt','tričko','👕'),('glasses','brýle','👓'),
('sun','slunce','☀️'),('moon','měsíc','🌙'),('star','hvězda','⭐'),('cloud','mrak','☁️'),('rain','déšť','🌧️'),
('snow','sníh','❄️'),('tree','strom','🌳'),('flower','květina','🌸'),('mountain','hora','⛰️'),('sea','moře','🌊'),
('fire','oheň','🔥'),('heart','srdce','❤️'),('eye','oko','👁️'),('hand','ruka','✋'),('ear','ucho','👂'),
('nose','nos','👃'),('gift','dárek','🎁'),('rocket','raketa','🚀'),('camera','fotoaparát','📷'),('crown','koruna','👑');

INSERT INTO public.questions (kind, category, prompt, options, answer, images, audio)
SELECT 'choice','Slovíčka', 'Co znamená slovo „' || w.word || '“?',
  ARRAY[w.cz] || ARRAY(SELECT v.cz FROM words v WHERE v.n <> w.n ORDER BY random() LIMIT 3),
  w.cz, ARRAY[w.emoji], w.word
FROM words w WHERE w.n <= 70;

INSERT INTO public.questions (kind, category, prompt, options, answer, images, audio)
SELECT 'match','Obrázky','Přetáhni slova ke správným obrázkům', array_agg(word ORDER BY rn), NULL, array_agg(emoji ORDER BY rn), NULL
FROM (
  SELECT word, emoji, rn, (rn - 1) / 4 AS g FROM (SELECT word, emoji, row_number() OVER (ORDER BY random()) rn FROM words) a
  UNION ALL
  SELECT word, emoji, rn, 100 + (rn - 1) / 4 FROM (SELECT word, emoji, row_number() OVER (ORDER BY random()) rn FROM words) b
) x GROUP BY g;

CREATE TEMP TABLE sent (cat text, s text, a text, b text, c text, d text);
INSERT INTO sent VALUES
('Gramatika','She ___ to school every day.','goes','go','going','gone'),
('Gramatika','I ___ a student.','am','is','are','be'),
('Gramatika','They ___ football now.','are playing','plays','is playing','play'),
('Gramatika','We ___ to London last year.','went','go','goes','going'),
('Gramatika','He ___ like broccoli.','doesn''t','don''t','isn''t','aren''t'),
('Gramatika','___ you speak English?','Do','Does','Are','Is'),
('Gramatika','My sister ___ two cats.','has','have','is','are'),
('Gramatika','There ___ three apples on the table.','are','is','be','am'),
('Gramatika','I ___ my homework yesterday.','did','do','does','done'),
('Gramatika','Look! It ___ raining.','is','are','am','be'),
('Gramatika','This is ___ umbrella.','an','a','the two','some'),
('Gramatika','I saw ___ elephant at the zoo.','an','a','two','many'),
('Gramatika','My dad is ___ than me.','taller','tall','tallest','more tall'),
('Gramatika','This is the ___ day of my life!','best','good','better','goodest'),
('Gramatika','I have never ___ sushi.','eaten','eat','ate','eating'),
('Gramatika','Tomorrow I ___ visit my grandma.','will','was','did','am'),
('Gramatika','How ___ milk is in the fridge?','much','many','lot','more'),
('Gramatika','How ___ pencils do you have?','many','much','lot','long'),
('Gramatika','She can ___ very fast.','run','runs','running','ran'),
('Gramatika','Tom and I ___ best friends.','are','is','am','be'),
('Gramatika','Where ___ he live?','does','do','is','are'),
('Gramatika','I was sleeping when the phone ___.','rang','ring','rings','ringing'),
('Gramatika','You ___ wear a helmet on a bike.','should','shoulds','to should','shouldn'),
('Gramatika','This book is ___.','mine','my','me','I'),
('Gramatika','Can you help ___, please?','me','I','my','mine'),
('Gramatika','The children ___ in the garden.','are','is','was','has'),
('Gramatika','I ___ TV when you called.','was watching','watched','am watching','watch'),
('Gramatika','We ___ lived here since 2020.','have','has','are','did'),
('Gramatika','If it rains, we ___ stay at home.','will','would','are','did'),
('Gramatika','She ___ her keys. She can''t find them.','has lost','have lost','lose','losing'),
('Gramatika','He is good ___ maths.','at','in','on','for'),
('Gramatika','My brother ___ up at 7 o''clock.','gets','get','getting','got up'),
('Gramatika','Whose bag is this? It''s ___.','Anna''s','Annas','Anna','Annas'''),
('Gramatika','There isn''t ___ water in the bottle.','any','some','many','a'),
('Gramatika','Would you like ___ tea?','some','any','many','a'),
('Gramatika','The film was very ___.','interesting','interested','interest','interests'),
('Gramatika','I''m ___ in animals.','interested','interesting','interest','interests'),
('Gramatika','He drives very ___.','carefully','careful','care','carefuly'),
('Gramatika','Did you ___ the new film?','see','saw','seen','sees'),
('Gramatika','They ___ at home yesterday.','were','was','are','be'),
('Gramatika','It''s the ___ animal in the world.','biggest','bigger','big','most big'),
('Gramatika','I ___ swim when I was five.','could','can','can''t to','am'),
('Gramatika','What ___ you doing?','are','is','do','does'),
('Gramatika','Mice is wrong. The plural of mouse is ___.','mice','mouses','mices','mouse'),
('Gramatika','One child, two ___.','children','childs','childrens','child'),
('Gramatika','My favourite colour ___ blue.','is','are','am','be'),
('Gramatika','Let''s ___ to the park!','go','going','goes','to go'),
('Gramatika','I''m hungry. I''m ___ to make a sandwich.','going','go','will','gonna to'),
('Gramatika','She ___ never late for school.','is','are','do','does'),
('Gramatika','We usually ___ dinner at 6.','have','has','having','are have'),
('Předložky','The cat is ___ the table.','under','at','of','to'),
('Předložky','I was born ___ May.','in','on','at','by'),
('Předložky','See you ___ Monday!','on','in','at','to'),
('Předložky','The lesson starts ___ 8 o''clock.','at','in','on','by'),
('Předložky','We live ___ Prague.','in','at','on','to'),
('Předložky','The picture is ___ the wall.','on','in','at','under'),
('Předložky','I go to school ___ bus.','by','with','on','in'),
('Předložky','He is sitting ___ me and Anna.','between','among','next','behind of'),
('Předložky','The bank is ___ to the post office.','next','near','beside','close'),
('Předložky','I''m waiting ___ my friend.','for','to','on','at'),
('Předložky','Listen ___ the teacher!','to','at','for','on'),
('Předložky','Look ___ this photo!','at','to','on','for'),
('Předložky','We go skiing ___ winter.','in','on','at','by'),
('Předložky','My birthday is ___ 5th June.','on','in','at','to'),
('Předložky','The ball is ___ the box.','in','on','at','of'),
('Předložky','She is afraid ___ spiders.','of','from','at','with'),
('Předložky','Get ___ the bus here.','off','out','down','away'),
('Předložky','The dog jumped ___ the fence.','over','under','in','through of'),
('Předložky','We walked ___ the forest.','through','across of','over','on'),
('Předložky','I''m ___ home now.','at','in','on','to'),
('Předložky','Put your shoes ___!','on','in','at','up of'),
('Předložky','The shop is open ___ 9 to 5.','from','since','at','between'),
('Předložky','He has lived here ___ 2015.','since','for','from','at'),
('Předložky','I have studied English ___ three years.','for','since','from','during'),
('Předložky','The plane flew ___ the clouds.','above','on','at','in'),
('Předložky','There is a tree ___ the house.','behind','back','after','between'),
('Předložky','I''ll finish it ___ Friday.','by','until','in','on'),
('Předložky','What''s ___ TV tonight?','on','in','at','by'),
('Předložky','She is good ___ painting.','at','in','on','with'),
('Předložky','Thank you ___ the present!','for','to','of','about'),
('Předložky','He arrived ___ the airport.','at','to','on','into'),
('Předložky','We are going ___ the cinema.','to','at','in','on'),
('Předložky','I''ll call you ___ the evening.','in','on','at','by'),
('Předložky','We sing carols ___ Christmas.','at','in','on','by'),
('Předložky','The keys are ___ my pocket.','in','on','at','by'),
('Předložky','He''s talking ___ the phone.','on','in','at','with'),
('Předložky','The cat ran ___ the stairs.','up','on','in','at'),
('Předložky','This present is ___ you.','for','to','at','of'),
('Předložky','I live ___ the third floor.','on','in','at','by'),
('Předložky','She walked ___ the room.','into','in to','at','onto of');

INSERT INTO public.questions (kind, category, prompt, options, answer, audio)
SELECT 'sentence', cat, s, ARRAY[a,b,c,d], a, replace(s, '___', a) FROM sent;