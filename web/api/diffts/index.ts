import { NowRequest, NowResponse } from "@now/node";
import { diff_match_patch, Diff } from "diff-match-patch";
const text1 = `The Centers for Disease Control and Prevention (CDC) has begun conducting blood tests it says will help determine if a person has been exposed to the coronavirus, even without showing symptoms, a CDC spokesperson told Politico.

These serological tests, or sero-surveys, are different from the nose swabs used to diagnose active cases of Covid-19. By analyzing blood, researchers will be able to tell if a person developed certain antibodies in the blood, indicating that they were infected by the virus and recovered.

If a person can be shown to have developed those protections against reinfection, they could potentially reenter society — and the workforce — during a time when millions of Americans live under orders to stay home to prevent the spread of Covid-19.

These tests can also help to retroactively collect data about how widespread the virus has been. In the absence of widespread diagnostic testing, many people who have demonstrated symptoms have simply been told to stay home, without receiving a formal diagnosis, while many more people never display symptoms at all.

“We’re just starting to do testing and we’ll report out on these very quickly,” Joe Bresee, deputy incident manager for the CDC’s pandemic response, told reporters. “We think the serum studies will be very important to understand what the true amount of infection is out in the community.”

According to reporting by the health journalism outlet Stat, the surveys will target three groups, in three phases: people living in hot spots of the disease, such as New York and Seattle, but who were not diagnosed; a representative sample of people living across the country, in areas with differing rates of infection; and health care workers.

The first phase, on people living in hot spots, has already begun, after the Food and Drug Administration (FDA) granted an emergency authorization for testing kits on April 1.

The tests, developed by the company Cellex, involve pricking a finger and can deliver a reading in 15 minutes. Other test manufacturers are working to deploy their own tests in the coming months.

The second phase, of the national population, will likely begin this summer, and there is no timeline yet for the third phase of health workers, according to STAT.

About 80 percent of confirmed Covid-19 cases correspond with mild to moderate symptoms, including coughing, fever, and exhaustion. Many cases will show no symptoms at all — perhaps 25 percent of cases, according to the CDC — and therefore likely go undiagnosed, but asymptomatic people can still pass the virus on to others who are more vulnerable to serious complications.

But because it has been difficult to procure diagnostic tests, people across the spectrum — those who feel perfectly healthy, those with presumed symptoms, and even some with more serious symptoms — have been encouraged to stay home, away from other people and away from hospitals, where infection can spread even more rapidly.

That’s why learning more about the full scope of the disease, including how many people have already experienced it and recovered, and the profile of people who did not become sick from the virus, could help researchers better understand the virus and how it spreads.

These tests could also help authorities better prepare for future pandemic response, according to Stat: “If it’s known that a high percentage of people in a community were likely infected when the virus moved through during its first wave of infections, the response to a reappearance later might be tailored to protect only high-risk people, for instance.”

Immunity testing is not a panacea
At a time when millions of Americans are forced to stay home in order to enact “social distancing” measures, figuring out who is protected against the disease’s spread could be the first step toward getting some people back out into the world.

As Vox’s Umair Irfan has written, testing may ”hold the key to a return to normal.”

A person who has had the virus, recovered, and developed antibodies — proteins built in the blood that help an immune system identify and neutralize threats — may have some level of protection against future spread. This makes them much less at risk of becoming infected, or spreading infection, when touching a cart at the grocery store, preparing food, or visiting a loved one, to name just some of the quotidian activities currently hampered by the coronavirus.

It is not yet known whether antibodies to this virus correlate with immunity, as they do with other viruses, however.

But in a recent interview on The Daily Show, Dr. Anthony Fauci, the US’s top infectious disease expert, said experts studying the disease feel “really confident” that recovered patients will have immunity against Covid-19.

“If this virus acts like every other virus that we know, once you get infected, get better, clear the virus, then you’ll have immunity that will protect you against re-infection,” he said.

There are other open questions, such as how long that immunity could last, and whether certain people can be reinfected. It is also not yet known how this virus mutates; if its mutation patterns mirror influenza, there could be a new strain each year, for example.

Some early research also indicates repeated or protracted exposure to the virus may cause more severe infections. That opens up the question of whether antibodies can prevent infection from larger “doses” of the virus — say, for hospital workers who are repeatedly exposed to the virus — or whether they are more effective among the general population.

Without a clear way of knowing who poses a risk, who is at risk, and who carries immunity, lifting social distancing measures early would prove a “nightmare scenario,” one infectious diseases researcher told Vox.

The CDC has given no indication that this round of serological testing is being conducted with an aim toward returning people to the workforce. Still, these antibodies may provide a key clue about who can safely return to work. This may be especially important in freeing up health care workers, at a time that many hospitals and clinics are facing staffing shortages due to coronavirus.

The UK has ordered 3.5 million of these tests, and both Italy and Germany are considering using them to provide citizens with “certifications” indicating they can return to the world.

As Irfan has written, these tests aren’t perfect:

Serological tests use blood serum, the liquid part of blood, excluding cells and clotting proteins. Even though SARS-CoV-2 isn’t typically present in blood, an infection causes white blood cells to make antibody proteins that help the immune system identify viruses and stop them, or mark infected cells for destruction.

Although these proteins can be detected in the bloodstream and blood serum, it can take several days for someone to make these antibodies after an infection. So a serological test isn’t always useful for finding an active infection — and can yield a false negative, showing that someone doesn’t have the virus when they actually do. The results of these tests can also be trickier to interpret than results from the more common RT-PCR tests used to diagnose Covid-19, which detect the virus’s genetic material.

Instead, these tests can be a screening tool. Researchers are also studying how antibodies could be collected in order to treat current cases of Covid-19; they are looking into how to use blood plasma from recovered patients as a possible emergency treatment of current cases.

But there are many caveats, as Irfan points out. There are shortages of necessary testing materials, and of personal protective equipment for medical staff conducting these tests. There are also many unknowns about how immunity to this new virus functions:

To safely return to work, a patient would have to ensure that they have immunity and that they are no longer spreading the virus. Since a serological test can only confirm the former, a patient may still need an additional RT-PCR test to establish the latter. That is, they need to test positive for immunity and negative for the virus itself.

SARS-CoV-2 is also a new virus, so researchers aren’t certain how long immunity will last. The virus could mutate and render past immunity ineffective, although scientists have found that it is mutating slowly, indicating that the protection from a past infection is likely to be effective for a while.

Putting too much stock in immunity, too, could create some kind of incentive for becoming infected in order to develop antibodies, which would be highly irresponsible during an outbreak of an infectious disease about which so much is still unknown.

Instead, Irfan argues, “the best strategy remains not getting infected in the first place and buying time until researchers can develop and deploy a vaccine.”`;
const text2 = "Lorem dolor sit amet.";

export default (request: NowRequest, response: NowResponse) => {
  const dpm = new diff_match_patch();
  let diffs: Diff[];
  for (let i = 0; i < 1000; i++) {
    diffs = dpm.diff_main(text1 + i.toString(), i + text1);
  }
  const oneDiff = diffs[1];
  response.status(200).json(oneDiff);
};
