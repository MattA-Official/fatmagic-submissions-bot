// Require the necessary discord.js classes
import { Client, Collection, GatewayIntentBits } from "discord.js";
import config from "./config.json" assert { type: "json" };
import "dotenv/config.js";

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const submissions = new Collection();

// When the client is ready
client.once("ready", (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// When the client recieves a message
client.on("messageCreate", (message) => {
  try {
    // Only process messages in the submissions channel
    if (message.channelId === config.channel) {
      // If the message has an attachment
      if (
        (message.attachments.size === 1 && message.embeds.length === 0) ||
        (message.attachments.size === 0 && message.embeds.length === 1)
      ) {
        // Check if the user has already submitted the maximum number of images
        if (submissions.get(message.author.id)?.length >= config.max) {
          // If so, reply and delete the message
          message
            .reply(
              `You have already submitted the maximum number of images (${config.max}) please delete a previous submission before submitting another.`
            )
            .then((m) => {
              setTimeout(() => {
                m.delete();
                message.delete();
              }, 5000);
            });
        } else {
          // If not, add the message to the user's submissions
          submissions.set(message.author.id, [
            message.id,
            ...(submissions.get(message.author.id) ?? []),
          ]);
        }
      }
      // If the message has too many attachments or embeds
      else if (message.attachments.size + message.embeds.length > 1) {
        // Reply and delete the message
        message.reply("You can only submit one image per message").then((m) => {
          setTimeout(() => {
            m.delete();
            message.delete();
          }, 5000);
        });
      }
      // If the message has no attachments or embeds
      else {
        // Delete the message
        message.delete();
      }
    }
  } catch (e) {
    console.log(e);
  }
});

// When the client recieves a deleted message
client.on("messageDelete", (message) => {
  // If the message was in the submissions channel
  try {
    if (message.channelId === config.channel) {
      // If the message was a submission
      if (submissions.get(message.author.id)?.includes(message.id)) {
        // Remove the message from the user's submissions
        submissions.set(
          message.author.id,
          submissions.get(message.author.id).filter((m) => m !== message.id)
        );
      }
    }
  } catch (e) {
    console.log(e);
  }
});

// Log in to Discord with your client's token
client.login(process.env.TOKEN);
