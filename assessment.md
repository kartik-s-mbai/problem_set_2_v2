### Q1. Where did the agent make you faster, and by how much?

The biggest time saving was the actual coding. Once I finally got the prompt and API sorted out, Claude created `api/resale.js`, `api/health.js`, and the main screen within a few minutes. I knew what I wanted the app to do, but I would not have known how to write the React code, serverless functions, or API calls myself. This was not something I could have written more slowly. It was something I realistically could not have written from scratch at all.

The frustrating part was that getting to that point took about five hours. Most of that time went into writing and rewriting the prompt, figuring out which API to use, and understanding why things were not working. Once the code existed, though, changes such as adding 3, 4, and 5 room prices or a town dropdown could be made within minutes instead of me spending hours learning how to code them.

The time I saved on coding went into testing the app, removing things the agent added that I did not want, and expanding it beyond the original Tampines 4 room view. Some Vercel tasks were also faster to just do myself, such as importing the repository, changing settings, and opening the URLs to test them.

### Q2. Where did it cost you time, and whose fault was that?

The biggest waste of time was the constant back and forth while creating the prompt. I would say that was both my fault and Claude's fault. I should have been more specific about whether I was starting a new project or continuing Problem Set 1. Because I did not make that clear, Claude assumed I was adding onto the old project. I then ran the first prompt in a brand new AI Studio project and basically nothing happened because it was looking for code and files that did not exist.

At the same time, Claude made too many assumptions instead of asking me what I meant. It kept adding extra steps beyond the course workflow and had me running random commands in PowerShell while I was already trying to figure out the API. I also kept confusing an API with an API key. I thought I needed a separate key for the HDB data and even tried using the LTA API key from the previous class.

So some of the wasted time came from my instructions being unfinished, but some came from Claude turning those gaps into assumptions. Once I clearly said this was a new project and that I wanted to stay within Prof Roh's steps, the process moved much faster.

### Q3. Did it ever hand you something that looked right and was not?

Yes. The first working version actually looked pretty good. The layout was clean, the cards looked professional, and it felt much more finished than I expected. The problem was that some of the information inside those cards was either unnecessary or wrong. It was basically a great layout with bad information.

For example, it added an "Estimated Couple Financing" card, CPF grant information, and several strange "case" boxes. At first I accepted them because they looked useful and believable. The financing figures were not coming from the HDB data at all, and the calculator was using an outdated 80% HDB loan limit. I only caught this when I later showed the screen to Claude while working on the prompt and it questioned where those numbers were coming from.

The case boxes were another example. They looked like real features, including a simulated 403 refusal, but they were not useful data for the person using the app. I had been judging the screen by whether it looked good instead of checking whether the information was actually supported. I removed the financing, grants, and case boxes and kept the app focused on the resale data.

### Q4. What did you have to know in order to supervise it?

I did not need to know how to write all the code myself, but I still needed to know enough to tell Claude and Google AI Studio what they were supposed to build and when they were going in the wrong direction. The first thing I needed to know was what was actually in my data. The HDB response included things such as town, flat type, floor area, remaining lease, and resale price. It did not contain loans, grants, interest rates, or recommended income. If I had checked every number against the data I provided, I would have caught the financing card immediately.

I also needed to know what I actually wanted the user to see. A couple checking HDB resale prices did not need buttons showing different error cases or a fake 403 screen. Those only existed because the agents thought they belonged there.

The bigger lesson for me was that I had to give the tools correct information and clear instructions. If I left something vague, Claude or AI Studio would often assume it knew what I meant instead of asking. I still had to supervise the purpose of the app, the data, and the information shown on screen. Otherwise I was basically babysitting two tools that were very confident they knew what I wanted.

### Q5. Which decisions did you keep, and should you have kept more or fewer?

I kept most of the important product decisions once I started testing the app myself. Claude originally restricted the app to 4 room HDBs in Tampines, and I had to manually change the URL using `?town=` to see other towns. I decided that was too limited, so I added a dropdown for the different towns and separate boxes for 3, 4, and 5 room flats. I also decided to remove the case buttons, grant information, and financing calculator because they either did not help the user or were not supported by the data.

Not every decision I made was a good one. I added places such as Bugis and River Valley to the dropdown even though the HDB dataset did not list them as towns, so they obviously returned nothing. That was made up on my part, not the agent's. I also spent too much time believing I needed an API key for the HDB dataset because I was mixing up the API itself with authentication.

I probably should have kept more of the product decisions myself from the beginning. I was comfortable letting Claude handle technical decisions such as how to write the code, but I also let it decide things such as the original user, the job the app was supposed to do, and some of the wording on the screen. In hindsight, those were decisions I should have owned. Who the product is for, what it shows, and what it actually says are more important for me to decide than exactly how the code is written.

### Q6. Now scale it up: what does this mean for a team of thirty?

With a team of thirty people using agents, I think there would need to be clear rules about what the agent is allowed to decide and what has to stay with the person using it. Before anyone starts building, they should write down who the user is, what the product is supposed to do, what data it is allowed to use, and what information should actually appear on the screen.

I would also put a review step before deployment where someone checks that every important number comes from an approved source and that the agent did not add features or claims nobody asked for. My own app shows why that matters. Claude and AI Studio added financing information, grants, case boxes, and other things that looked polished but were either unnecessary or unsupported by the data.

With one person, I could eventually catch and remove those things myself. With thirty people, those assumptions could easily make it into the final product without anybody noticing.

I would let agents help with building and technical work, but anything a user sees or could use to make a decision should still have a person responsible for verifying it before it ships.
