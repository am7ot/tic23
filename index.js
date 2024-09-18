const { Client, Intents, MessageActionRow, MessageSelectMenu, MessageEmbed, MessageButton } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

const LOG_CHANNEL_ID = 'LOG_CHANNEL_ID'; // Replace with your log channel ID
const MODERATOR_ROLE_ID = 'MODERATOR_ROLE_ID'; // Replace with your moderator role ID
const IMAGE_URL = 'https://your-image-url-here.com/image.jpg'; // Your image URL

client.once('ready', () => {
    console.log('Ticket Bot is online!');
});

// Function to log ticket actions
async function logTicketAction(ticketType, action, user, guild) {
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        logChannel.send(`Ticket **${ticketType}** has been ${action} by <@${user.id}>.`);
    }
}

client.on('messageCreate', async message => {
    if (message.content.toLowerCase() === '!ticket') {
        // Create a dropdown with "Ask" and "Design" options
        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('ticket-dropdown')
                    .setPlaceholder('Select your ticket type')
                    .addOptions([
                        {
                            label: 'Ask',
                            description: 'Create a ticket for asking questions',
                            value: 'ask',
                        },
                        {
                            label: 'Design',
                            description: 'Create a ticket for design help',
                            value: 'design',
                        }
                    ])
            );

        // Create an embed message for the ticket system
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Support Ticket System')
            .setDescription('Select the type of ticket you want to create using the dropdown below.')
            .setImage(IMAGE_URL);

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isSelectMenu()) return;

    const { customId, values, user, guild } = interaction;

    if (customId === 'ticket-dropdown') {
        const ticketType = values[0];

        // Create a ticket channel based on the selected option
        const ticketChannel = await guild.channels.create(`ticket-${ticketType}-${user.id}`, {
            type: 'GUILD_TEXT',
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: user.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                },
                {
                    id: MODERATOR_ROLE_ID,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_CHANNELS'],
                }
            ],
        });

        // Log the ticket creation
        await logTicketAction(ticketType, 'created', user, guild);

        // Create an embed for the ticket channel
        const ticketEmbed = new MessageEmbed()
            .setColor('#00ff00')
            .setTitle(`Ticket: ${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)}`)
            .setDescription(`Ticket created by <@${user.id}>. A staff member will assist you shortly.`)
            .setFooter('Use the buttons below to manage the ticket.');

        // Add buttons for closing and claiming the ticket
        const buttonRow = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('claim-ticket')
                    .setLabel('Claim Ticket')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('close-ticket')
                    .setLabel('Close Ticket')
                    .setStyle('DANGER')
            );

        await ticketChannel.send({
            content: `Ticket created for **${ticketType}** by <@${user.id}>.`,
            embeds: [ticketEmbed],
            components: [buttonRow]
        });

        await interaction.reply({ content: `Your **${ticketType}** ticket has been created: ${ticketChannel}`, ephemeral: true });
    }
});

// Button interactions for claim and close
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const { customId, user, guild, channel } = interaction;

    if (customId === 'claim-ticket') {
        // Logic for claiming the ticket
        const claimEmbed = new MessageEmbed()
            .setColor('#00ff00')
            .setDescription(`Ticket claimed by <@${user.id}>.`);

        await channel.send({ embeds: [claimEmbed] });

        // Log the ticket claim
        await logTicketAction('ticket', 'claimed', user, guild);

        await interaction.reply({ content: 'You have claimed this ticket.', ephemeral: true });
    }

    if (customId === 'close-ticket') {
        // Logic for closing the ticket
        const closeEmbed = new MessageEmbed()
            .setColor('#ff0000')
            .setDescription(`Ticket closed by <@${user.id}>.`);

        await channel.send({ embeds: [closeEmbed] });

        // Log the ticket closure
        await logTicketAction('ticket', 'closed', user, guild);

        await interaction.reply({ content: 'This ticket will be closed.', ephemeral: true });
        setTimeout(() => channel.delete(), 5000); // Delete the channel after 5 seconds
    }
});

client.login('YOUR_BOT_TOKEN');
