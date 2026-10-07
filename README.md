1. Description: a website for groups of people to choose a restaurant, once logged in anyone can create a group and add people by their username. There are 3 phases for groups, draft, voting, and complete. In the draft the group leader can add members and select from the 50 closest restaurants based on yelp api. Once they are done selecting, they can move to the voting phase. In voting phase all members of the group rate a restaurant from 1-5, and you can check current results at any time. A rating of 1 by any member automatically disqualifies a restaurant, 2 is worth 1 "point", 3 is 3, 4 is 4, 5 is 5. The top 3 restaurants are displayed when you check results. Once enough people have voted the group owner can move it to complete, where no more votes can be done but you can check results and see the winner. Besides that we put a map of the closest restaurants that you can click on and view details of the restaurants. 

Link: https://where2eat-two.vercel.app/

2.  Instructions: there are no specific instructions, creating an account is very easy and you just need any username and password. If you want a test one without creating your own, you can use username testingaccount and password password. Besides that, follow the instructions in description to create a group, pick restaurants, vote, and see results. 

3. Technologies: Typescript for the code, Nextjs for backend and data, Shadcn for components, Tailwindcss for styling, Prisma ORM with a Neon Postgres database.

4. Challenges: a technical challenge was figuring out the map and API at first, design in general and figuring out both ux/ui was a bit challenging. 

5. Contribution
    - Sylvia: created the original home page stuff, the group cards and the map. got groups to work with backend, and made the thing to remove members, leave groups, and delete groups. created the map on the right side using Yelp API and leaflet. made the move to complete and move to voting backend stuff, and the calculate results. also made the voting system and did a few small ui cleanup things/fixes.
    - Samura: Implemented the nearby restaurant map and integrated restaurant search using the Yelp API. Developed the restaurant selection interface, including displaying restaurant details such as star rating, number of reviews, price range, and a link to view the restaurant on Yelp. Did user interface and dashbord. 
    - Ryan: Set up the git repo with our tech stack, created the database schema, implemented authentication with protected routes and login/signup form pages, added the capability for the map to show only the selected restaurants instead of every one nearby, added the ability to search for users to add to a group, and improved overall UX/UI with a more streamlined workflow including an improved layout with better styling.

6. Project video:

https://drive.google.com/file/d/1h84Xxa9sE9jywCLenKgQG_k3dlnphcBV/view?usp=sharing check this
