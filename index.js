const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

require("dotenv").config();

const { JSDOM } = require("jsdom");

const { Client } = require("discord.js");
const client = new Client({ intents: 131071 });

client.config = require("./config.json");

const getChannelSaran = async () => {
  const channelSaran = {
    saranDiscord: await client.channels.fetch(
      client.config.discordChannelId.saranDiscord
    ),
    saranYoutube: await client.channels.fetch(
      client.config.discordChannelId.saranYoutube
    ),
    saranWebsite: await client.channels.fetch(
      client.config.discordChannelId.saranWebsite
    ),
  };
  return channelSaran;
};

let levelingData;

const refreshData = () => {
  JSDOM.fromURL("https://lurkr.gg/levels/1054414599945998416")
    .then((dom) => {
      levelingData = dom.window.document.querySelector("script#__NEXT_DATA__").textContent
      levelingData = JSON.parse(levelingData)
      levelingData = levelingData.props.pageProps
    })
    .catch((error) => {
      console.error("Error fetching HTML content:", error);
    });
};

refreshData();

setInterval(refreshData, 60000);

const app = express();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/node_modules/bootstrap/dist")));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", function (req, res) {
  res.render("home", { title: "Home", leaderboard: levelingData.levels });
});

app.get("/leaderboard", function (req, res) {
  res.render("leaderboard", { title: "Leaderboard", levelingData });
});

const port = 8080;

client
  .login(process.env.DISCORDBOTTOKEN)
  .then(async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const channelSaran = await getChannelSaran();

    const SaranRouter = require("./routes/Saran.js");

    const saranRouter = new SaranRouter(channelSaran).getRouter();

    app.use("/saran", saranRouter);

    app.listen(port, () => {
      console.log(`App is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Cannot login to discord", err);
    console.log("Disable /saran");

    app.listen(port, () => {
      console.log(`App is running on port ${port}`);
    });
  });
